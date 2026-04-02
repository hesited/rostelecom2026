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
// 🪟 AUTH MODAL (ГОТОВЫЙ)
// ===============================
function openAuthModal(mode) {
    // удаляем старое окно если есть
    const old = document.getElementById('authModal');
    if (old) old.remove();

    let modal = document.createElement('div');
    modal.id = 'authModal';

    modal.style = `
        position: fixed;
        top: 0; left: 0;
        width: 100%; height: 100%;
        background: rgba(0,0,0,0.6);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
    `;

    modal.innerHTML = `
        <div style="background: white; padding: 20px; border-radius: 12px; width: 300px;">
            <h3 style="margin-bottom: 10px;">
                ${mode === 'login' ? 'Вход' : 'Регистрация'}
            </h3>

            ${mode === 'register' 
                ? <input id="authRegName" placeholder="Имя" style="width:100%; margin-bottom:10px;"> 
                : ''}

            <input id="${mode === 'login' ? 'authLoginEmail' : 'authRegEmail'}" 
                   placeholder="Email" 
                   style="width:100%; margin-bottom:10px;">

            <input id="${mode === 'login' ? 'authLoginPassword' : 'authRegPassword'}" 
                   type="password" 
                   placeholder="Пароль" 
                   style="width:100%; margin-bottom:10px;">

            <button id="authSubmitBtn" style="width:100%; margin-bottom:10px;">
                ${mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
            </button>

            <button id="closeModal" style="width:100%;">Закрыть</button>
        </div>
    `;

    document.body.appendChild(modal);

    // закрытие
    document.getElementById('closeModal').onclick = () => modal.remove();

    // логика кнопки
    document.getElementById('authSubmitBtn').onclick = () => {
        if (mode === 'login') {
            submitLogin();
        } else {
            submitRegister();
        }
    };
}

// делаем глобальной
window.openAuthModal = openAuthModal;


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
