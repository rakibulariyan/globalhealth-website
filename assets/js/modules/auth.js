export async function handleLogin(email, password) {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) throw error;

        return data;
    } catch (err) {
        console.error("Login failed:", err);
        throw err;
    }
}
