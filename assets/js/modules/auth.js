import { supabase } from "../core/supabase-config.js"; 
import { showApp, showLogin } from "../core/router.js";
import { updateUIForRole, setSession } from "../core/session.js";

// GLOBAL USER & ROLE
let currentUser = null;
let currentRole = null;

// EXPORT login handler (correct)
export async function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    if (!email || !password) {
        alert("Please enter both email and password");
        return;
    }

    try {
        console.log("Attempting Supabase Auth login:", email);

        // Supabase sign-in
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;
        if (!data.user) throw new Error("Invalid login");

        console.log("Supabase login success:", data.user);

        // Fetch role from employees table
        const { data: emp, error: empErr } = await supabase
            .from("employees")
            .select("role,name,email")
            .eq("email", email)
            .single();

        if (empErr) throw empErr;

        setSession(
            {
                name: emp.name,
                email: emp.email
            },
            emp.role
        );

        console.log("Role fetched:", currentRole);

        // UI
        updateUIForRole();
        showApp();
        
    } catch (err) {
        console.error("Login failed:", err);
        alert("Login failed: " + err.message);
    }
}

// EXPORT logout handler
export async function handleLogout() {
    try {
        await supabase.auth.signOut();
        currentUser = null;
        currentRole = null;
        showLogin();
        console.log("Logged out");
    } catch (err) {
        console.error("Logout failed:", err);
    }
}
