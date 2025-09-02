-- Manual SQL script to create chat tables in Supabase
-- Execute these commands manually in the Supabase SQL Editor

-- 1. Create chats table
CREATE TABLE IF NOT EXISTS public.chats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  vet_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(owner_id, vet_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chats_participants ON public.chats(owner_id, vet_id);
CREATE INDEX IF NOT EXISTS idx_chats_updated_at ON public.chats(updated_at DESC);

-- 2. Create messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID REFERENCES public.chats(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'audio', 'location', 'appointment', 'file')),
  content TEXT,
  image_url TEXT,
  audio_url TEXT,
  audio_duration INTEGER,
  location_data JSONB,
  appointment_data JSONB,
  file_name TEXT,
  file_url TEXT,
  metadata JSONB,
  read_by JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON public.chat_messages(chat_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.chat_messages(created_at DESC);

-- 3. Create chat_participants table (for future group chats)
CREATE TABLE IF NOT EXISTS public.chat_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID REFERENCES public.chats(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'member', 'admin')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(chat_id, user_id)
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_participants_chat_id ON public.chat_participants(chat_id);
CREATE INDEX IF NOT EXISTS idx_participants_user_id ON public.chat_participants(user_id);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;

-- 5. RLS policies for chats table
DROP POLICY IF EXISTS "Users can view their own chats" ON public.chats;
CREATE POLICY "Users can view their own chats" ON public.chats
  FOR SELECT USING (auth.uid() = owner_id OR auth.uid() = vet_id);

DROP POLICY IF EXISTS "Users can create chats they participate in" ON public.chats;
CREATE POLICY "Users can create chats they participate in" ON public.chats
  FOR INSERT WITH CHECK (auth.uid() = owner_id OR auth.uid() = vet_id);

DROP POLICY IF EXISTS "Users can update their own chats" ON public.chats;
CREATE POLICY "Users can update their own chats" ON public.chats
  FOR UPDATE USING (auth.uid() = owner_id OR auth.uid() = vet_id);

-- 6. RLS policies for messages table
DROP POLICY IF EXISTS "Users can view messages in their chats" ON public.chat_messages;
CREATE POLICY "Users can view messages in their chats" ON public.chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chats 
      WHERE chats.id = chat_messages.chat_id 
      AND (chats.owner_id = auth.uid() OR chats.vet_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can send messages in their chats" ON public.chat_messages;
CREATE POLICY "Users can send messages in their chats" ON public.chat_messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.chats 
      WHERE chats.id = chat_messages.chat_id 
      AND (chats.owner_id = auth.uid() OR chats.vet_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update their own messages" ON public.chat_messages;
CREATE POLICY "Users can update their own messages" ON public.chat_messages
  FOR UPDATE USING (auth.uid() = sender_id);

-- 7. RLS policies for participants table
DROP POLICY IF EXISTS "Users can view participants in their chats" ON public.chat_participants;
CREATE POLICY "Users can view participants in their chats" ON public.chat_participants
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.chats 
      WHERE chats.id = chat_participants.chat_id 
      AND (chats.owner_id = auth.uid() OR chats.vet_id = auth.uid())
    )
  );

-- 8. Function to update chat last_message_at when new message is sent
CREATE OR REPLACE FUNCTION update_chat_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.chats 
  SET 
    last_message_at = NEW.created_at,
    updated_at = NEW.created_at
  WHERE id = NEW.chat_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Trigger to automatically update chat timestamp
DROP TRIGGER IF EXISTS trigger_update_chat_last_message ON public.chat_messages;
CREATE TRIGGER trigger_update_chat_last_message
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW EXECUTE FUNCTION update_chat_last_message();

-- 10. Function to mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_as_read(
  p_chat_id UUID,
  p_user_id UUID
) RETURNS VOID AS $$
BEGIN
  UPDATE public.chat_messages
  SET read_by = COALESCE(read_by, '{}'::jsonb) || jsonb_build_object(p_user_id::text, NOW()::text)
  WHERE chat_id = p_chat_id 
  AND sender_id != p_user_id
  AND NOT (read_by ? p_user_id::text);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Function to get unread message count
CREATE OR REPLACE FUNCTION get_unread_message_count(
  p_user_id UUID,
  p_chat_id UUID DEFAULT NULL
) RETURNS TABLE(chat_id UUID, unread_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cm.chat_id,
    COUNT(*) as unread_count
  FROM public.chat_messages cm
  JOIN public.chats c ON c.id = cm.chat_id
  WHERE 
    (c.owner_id = p_user_id OR c.vet_id = p_user_id)
    AND cm.sender_id != p_user_id
    AND NOT (cm.read_by ? p_user_id::text)
    AND (p_chat_id IS NULL OR cm.chat_id = p_chat_id)
  GROUP BY cm.chat_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.chats TO anon, authenticated;
GRANT ALL ON public.chat_messages TO anon, authenticated;
GRANT ALL ON public.chat_participants TO anon, authenticated;

-- Enable realtime on tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.chats;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_participants;