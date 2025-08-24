# 🚀 Comandos Rápidos Wuauser

## Comandos de Desarrollo

### crear-pantalla [nombre]
@filesystem read wuauser-app/src/screens/
@memory recall screen_template
@filesystem create wuauser-app/src/screens/[Nombre]Screen.tsx
@filesystem update wuauser-app/src/navigation/AppNavigator.tsx
@github commit -m "feat: añadir pantalla [nombre]"

### crear-servicio [entidad]
@filesystem create wuauser-app/src/services/[entidad]Service.ts
@postgresql check table [entidad]
@memory save service_pattern

### setup-feature [feature]
@project_manager analyze requirements for [feature]
@backend_engineer create database schema
@mobile_developer implement screens
@ui_designer polish UI
@quality_engineer test feature

## Comandos de Base de Datos

### crear-tabla [nombre]
@postgresql create table [nombre]
@filesystem create wuauser-app/src/types/[nombre].ts
@github commit -m "db: añadir tabla [nombre]"

### añadir-rls [tabla]
@postgresql add RLS policy to [tabla]
@memory save rls_pattern

## Comandos de Testing

### test-pantalla [nombre]
@playwright test wuauser-app/src/screens/[Nombre]Screen.tsx
@filesystem create wuauser-app/tests/screens/[Nombre]Screen.test.tsx

### test-e2e
@hyperbrowser open localhost:19006
@playwright run e2e tests
@github create test report

## Comandos de Git

### feature-start [nombre]
@github checkout -b feature/[nombre]
@memory save current_feature [nombre]

### feature-complete
@memory recall current_feature
@github add .
@github commit
@github push
@github create PR
