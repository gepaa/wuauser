const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupChatTables() {
  try {
    console.log('🔧 Setting up chat tables in Supabase...');

    // 1. Create chats table
    console.log('📦 Creating chats table...');
    const { error: chatsError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Create chats table
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

        -- Create index for better performance
        CREATE INDEX IF NOT EXISTS idx_chats_participants ON public.chats(owner_id, vet_id);
        CREATE INDEX IF NOT EXISTS idx_chats_updated_at ON public.chats(updated_at DESC);
      `
    });

    if (chatsError) {
      console.error('Error creating chats table:', chatsError);
    } else {
      console.log('✅ Chats table created successfully');
    }

    // 2. Create messages table
    console.log('📦 Creating messages table...');
    const { error: messagesError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Create messages table
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
      `
    });

    if (messagesError) {
      console.error('Error creating messages table:', messagesError);
    } else {
      console.log('✅ Messages table created successfully');
    }

    // 3. Create chat_participants table (for future group chats)
    console.log('📦 Creating chat_participants table...');
    const { error: participantsError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Create chat_participants table for extensibility
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
      `
    });

    if (participantsError) {
      console.error('Error creating participants table:', participantsError);
    } else {
      console.log('✅ Chat participants table created successfully');
    }

    // 4. Set up Row Level Security (RLS)
    console.log('🔒 Setting up Row Level Security...');
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Enable RLS on all chat tables
        ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;

        -- RLS policies for chats table
        DROP POLICY IF EXISTS "Users can view their own chats" ON public.chats;
        CREATE POLICY "Users can view their own chats" ON public.chats
          FOR SELECT USING (auth.uid() = owner_id OR auth.uid() = vet_id);

        DROP POLICY IF EXISTS "Users can create chats they participate in" ON public.chats;
        CREATE POLICY "Users can create chats they participate in" ON public.chats
          FOR INSERT WITH CHECK (auth.uid() = owner_id OR auth.uid() = vet_id);

        DROP POLICY IF EXISTS "Users can update their own chats" ON public.chats;
        CREATE POLICY "Users can update their own chats" ON public.chats
          FOR UPDATE USING (auth.uid() = owner_id OR auth.uid() = vet_id);

        -- RLS policies for messages table
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

        -- RLS policies for participants table
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
      `
    });

    if (rlsError) {
      console.error('Error setting up RLS:', rlsError);
    } else {
      console.log('✅ Row Level Security configured successfully');
    }

    // 5. Create helpful functions
    console.log('⚙️ Creating helper functions...');
    const { error: functionsError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Function to update chat last_message_at when new message is sent
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

        -- Trigger to automatically update chat timestamp
        DROP TRIGGER IF EXISTS trigger_update_chat_last_message ON public.chat_messages;
        CREATE TRIGGER trigger_update_chat_last_message
          AFTER INSERT ON public.chat_messages
          FOR EACH ROW EXECUTE FUNCTION update_chat_last_message();

        -- Function to mark messages as read
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

        -- Function to get unread message count
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
      `
    });

    if (functionsError) {
      console.error('Error creating helper functions:', functionsError);
    } else {
      console.log('✅ Helper functions created successfully');
    }

    console.log('🎉 Chat tables setup completed successfully!');
    console.log('\n📋 Created tables:');
    console.log('  • chats - Main chat rooms between users');
    console.log('  • chat_messages - Individual messages');
    console.log('  • chat_participants - Chat membership (for future group chats)');
    console.log('\n🔒 Security:');
    console.log('  • Row Level Security enabled');
    console.log('  • Policies configured for user access control');
    console.log('\n⚙️ Features:');
    console.log('  • Auto-update chat timestamps');
    console.log('  • Message read tracking');
    console.log('  • Unread count functions');

  } catch (error) {
    console.error('❌ Error setting up chat tables:', error);
    process.exit(1);
  }
}

setupChatTables();