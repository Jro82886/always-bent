-- Enable anonymous sign-ins for chat functionality
-- This allows users to send messages without creating an account

-- Enable anonymous authentication
INSERT INTO auth.config (parameter, value)
VALUES ('enable_anonymous_sign_ins', 'true')
ON CONFLICT (parameter)
DO UPDATE SET value = 'true';
