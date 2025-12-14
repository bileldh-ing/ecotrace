
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xxfcadmsckctyqisnnus.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4ZmNhZG1zY2tjdHlxaXNubnVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzMzU3ODYsImV4cCI6MjA3OTkxMTc4Nn0.Ug-WzxBq44LfT6oztiSlo7fYDhLthBEl_FC6NZtfZYY'

export const supabase = createClient(supabaseUrl, supabaseKey)
