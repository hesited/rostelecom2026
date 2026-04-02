// ===============================
// 🔧 CONFIG
// ===============================
const SUPABASE_URL = 'https://ihycrrphqdzgtdizplqu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImloeWNycnBocWR6Z3RkaXpwbHF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNTQ3NTIsImV4cCI6MjA5MDYzMDc1Mn0.YcIEt2xYvy9GHwhca6BNS2h0F_oEVmcFToKA-tibp4o';

// ===============================
// 🚀 INIT
// ===============================
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('✅ Supabase initialized');

// ===============================
// 🧪 TEST CONNECTION
// ===============================
async function testSupabase() {
    const { data, error } = await supabaseClient
        .from('users')
        .select('*')
        .limit(1);

    console.log('TEST:', data, error);
}

// ===============================
// 📝 REGISTER
// ===============================
async function submitRegister() {
    console.log('=== REGISTER ===');

    let name = document.getElementById('authRegName')?.value.trim();
    let email = document.getElementById('authRegEmail')?.value.trim();
    let password = document.getElementById('authRegPassword')?.value;

    if (!name || !email || !password) {
        alert('Заполни все поля');
        return;
    }

    // 1. Регистрация в auth
    const { data: authData, error: authError } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
            data: { name }
        }
    });

    if (authError) {
        console.error(authError);
        alert('Ошибка регистрации: ' + authError.message);
        return;
    }

    const user = authData.user;

    if (!user) {
        alert('Пользователь не создан');
        return;
    }

    console.log('Auth OK:', user.id);

    // 2. Запись в таблицу users
    const { error: dbError } = await supabaseClient
        .from('users')
        .insert([{
            id: user.id,
            email: email,
            name: name,
            tariff: 'free',
            created_at: new Date().toISOString()
        }]);

    if (dbError) {
        console.error(dbError);
        alert('Ошибка записи в таблицу: ' + dbError.message);
        return;
    }

    console.log('✅ User saved in table');
    alert('Регистрация успешна');
}

// ===============================
// 🔐 LOGIN
// ===============================
async function submitLogin() {
    console.log('=== LOGIN ===');

    let email = document.getElementById('authLoginEmail')?.value.trim();
    let password = document.getElementById('authLoginPassword')?.value;

    if (!email || !password) {
        alert('Заполни все поля');
        return;
    }

    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        console.error(error);
        alert('Ошибка входа: ' + error.message);
        return;
    }

    console.log('✅ Login success:', data.user);
    alert('Вход выполнен');
}

// ===============================
// 🚪 LOGOUT
// ===============================
async function logout() {
    const { error } = await supabaseClient.auth.signOut();

    if (error) {
        console.error(error);
        alert('Ошибка выхода');
        return;
    }

    console.log('👋 Logout');
    alert('Вы вышли');
}

// ===============================
// 👤 GET CURRENT USER
// ===============================
async function getCurrentUser() {
    const { data, error } = await supabaseClient.auth.getUser();

    if (error) {
        console.error(error);
        return null;
    }

    return data.user;
}

// ===============================
// 🌍 GLOBAL
// ===============================
window.submitRegister = submitRegister;
window.submitLogin = submitLogin;
window.logout = logout;
window.testSupabase = testSupabase;
