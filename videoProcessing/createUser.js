import { createClient } from "@supabase/supabase-js"
const serviceKey = process.env.SUPABASE_SERVICE_KEY
const supabase = createClient("https://zlencksndnokcgxdxqec.supabase.co", serviceKey)
const password = process.env.PASSWORD
const email = process.env.EMAIL

const generate = async () => {
    const { data: user, error } = await supabase.auth.api.createUser({
        email:email,
        password: password,
        email_confirm: true,
        user_metadata: { name: 'Github Action uploader' }
      })
    console.log(user)
    console.log(error)
}

generate()