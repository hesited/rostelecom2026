// Подключаем Supabase
const SUPABASE_URL = 'https://ihycrrphqdzgtdizplqu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImloeWNycnBocWR6Z3RkaXpwbHF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNTQ3NTIsImV4cCI6MjA5MDYzMDc1Mn0.YcIEt2xYvy9GHwhca6BNS2h0F_oEVmcFToKA-tibp4o';

console.log('=== SUPABASE INIT ===');
console.log('URL:', SUPABASE_URL);
console.log('Key exists:', !!SUPABASE_ANON_KEY);

// Создание клиента Supabase
const { createClient } = window.supabase;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('Supabase client created:', !!supabase);

// Глобальные переменные
let currentUser = null;

// Test Supabase connection
async function testSupabaseConnection() {
    try {
        console.log('=== TESTING SUPABASE CONNECTION ===');
        
        // Test basic connection
        const { data, error } = await supabase
            .from('users')
            .select('count')
            .limit(1);
            
        console.log('Connection test result:', { data, error });
        
        if (error) {
            console.error('Supabase connection failed:', error);
            return false;
        }
        
        console.log('✅ Supabase connection successful');
        return true;
    } catch (error) {
        console.error('Supabase test error:', error);
        return false;
    }
}

// ========== Supabase функции ==========
async function signUp(email, password, name, tariff = 'free') {
    try {
        console.log('=== РЕГИСТРАЦИЯ ===');
        console.log('Данные:', { email, name, tariff });
        
        // Сначала регистрируем в auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    name: name,
                    tariff: tariff
                }
            }
        });
        
        console.log('Результат auth.signUp:', authData, authError);
        
        if (authError) {
            console.error('Ошибка auth.signUp:', authError);
            throw new Error(`Auth ошибка: ${authError.message}`);
        }
        
        // Проверяем, что пользователь создан
        if (!authData.user) {
            throw new Error('Пользователь не создан в auth');
        }
        
        console.log('Auth успешен, пользователь ID:', authData.user.id);
        
        // Затем создаем запись в таблице users с ID из auth
        const { data: userData, error: userError } = await supabase
            .from('users')
            .insert([{
                id: authData.user.id,
                email: email,
                name: name,
                password: password,
                tariff: tariff,
                created_at: new Date().toISOString()
            }])
            .select();
            
        console.log('Результат вставки в users:', userData, userError);
            
        if (userError) {
            console.error('Ошибка вставки в users:', userError);
            throw new Error(`Ошибка базы данных: ${userError.message}`);
        }
        
        // Устанавливаем текущего пользователя
        currentUser = userData[0];
        console.log('✅ Пользователь успешно зарегистрирован:', currentUser);
        
        return { success: true, data: userData[0] };
    } catch (error) {
        console.error('❌ Ошибка регистрации:', error);
        return { success: false, error: error.message };
    }
}

async function signIn(email, password) {
    try {
        console.log('=== ВХОД ===');
        
        // Сначала входим через auth
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) {
            console.error('Ошибка входа в auth:', error);
            throw error;
        }
        
        // Затем получаем данные из таблицы users
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();
            
        if (userError) {
            console.error('Ошибка поиска в users:', userError);
            throw userError;
        }
        
        // Устанавливаем текущего пользователя
        currentUser = userData;
        console.log('Пользователь вошел:', currentUser);
        
        return { success: true, user: userData };
    } catch (error) {
        console.error('Ошибка входа:', error);
        return { success: false, error: error.message };
    }
}

async function signOut() {
    try {
        console.log('=== ВЫХОД ===');
        
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        
        currentUser = null;
        console.log('Пользователь вышел');
        
        return { success: true };
    } catch (error) {
        console.error('Ошибка выхода:', error);
        return { success: false, error: error.message };
    }
}

async function getCurrentUser() {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) throw error;
        if (!user) return null;
        
        // Получаем полные данные пользователя
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('email', user.email)
            .single();
            
        if (userError) throw userError;
        
        return userData;
    } catch (error) {
        console.error('Ошибка получения текущего пользователя:', error);
        return null;
    }
}

// Функции интерфейса
function openAuthModal(mode) {
    console.log('Открытие модального окна:', mode);
    
    let modal = document.createElement('div');
    modal.id = 'authModal';
    modal.className = 'custom-modal';
    modal.innerHTML = `
        <div class="modal-window auth-modal-content">
            <div style="text-align: center; margin-bottom: 16px;">
                <img src="https://static.tildacdn.com/tild6433-3562-4865-a665-613632306561/medium_565ce8678920c.png" style="height: 48px;">
                <h3 style="margin-top: 8px;">Ростелеком Дом</h3>
            </div>
            <div id="authModalLoginForm">
                <input type="text" id="authLoginName" class="auth-input" placeholder="Имя" value="">
                <input type="email" id="authLoginEmail" class="auth-input" placeholder="Email" value="">
                <input type="password" id="authLoginPassword" class="auth-input" placeholder="Пароль" value="">
                <button class="btn-primary" style="width: 100%;" onclick="submitLogin()">Войти</button>
                <div class="auth-switch">Нет аккаунта? <a onclick="switchAuthModal('register')">Зарегистрироваться</a></div>
            </div>
            <div id="authModalRegisterForm" class="hidden">
                <input type="text" id="authRegName" class="auth-input" placeholder="Имя">
                <input type="email" id="authRegEmail" class="auth-input" placeholder="Email">
                <input type="password" id="authRegPassword" class="auth-input" placeholder="Пароль">
                <button class="btn-primary" style="width: 100%;" onclick="submitRegister()">Создать аккаунт</button>
                <div class="auth-switch">Уже есть аккаунт? <a onclick="switchAuthModal('login')">Войти</a></div>
            </div>
            <button class="btn-outline-purple" style="width: 100%; margin-top: 12px;" onclick="closeAuthModal()">Закрыть</button>
        </div>
    `;
    document.body.appendChild(modal);
    modal.style.display = 'flex !important';
    
    if(mode === 'register') {
        document.getElementById('authModalLoginForm').classList.add('hidden');
        document.getElementById('authModalRegisterForm').classList.remove('hidden');
    } else {
        document.getElementById('authModalLoginForm').classList.remove('hidden');
        document.getElementById('authModalRegisterForm').classList.add('hidden');
    }
}

function switchAuthModal(mode) {
    console.log('Переключение режима:', mode);
    
    if(mode === 'register') {
        document.getElementById('authModalLoginForm').classList.add('hidden');
        document.getElementById('authModalRegisterForm').classList.remove('hidden');
    } else {
        document.getElementById('authModalLoginForm').classList.remove('hidden');
        document.getElementById('authModalRegisterForm').classList.add('hidden');
    }
}

function closeAuthModal() {
    console.log('Закрытие модального окна');
    let modal = document.getElementById('authModal');
    if(modal) modal.remove();
}

async function submitLogin() {
    console.log('=== ПОПЫТКА ВХОДА ===');
    
    let name = document.getElementById('authLoginName').value.trim();
    let email = document.getElementById('authLoginEmail').value.trim();
    let pass = document.getElementById('authLoginPassword').value;
    
    console.log('Введенные данные:', { name, email, pass: pass ? '***' : '' });
    
    if(!name || !email || !pass) {
        alert('Заполните все поля');
        return;
    }
    
    const result = await signIn(email, pass);
    
    if(result.success) {
        console.log('Вход успешен!');
        currentUser = result.user;
        closeAuthModal();
        alert('Вход выполнен успешно!');
    } else {
        console.error('Ошибка входа:', result.error);
        alert('Ошибка входа: ' + result.error);
    }
}

async function submitRegister() {
    console.log('=== ПОПЫТКА РЕГИСТРАЦИИ ===');
    
    let name = document.getElementById('authRegName').value.trim();
    let email = document.getElementById('authRegEmail').value.trim();
    let pass = document.getElementById('authRegPassword').value;
    
    console.log('Введенные данные:', { name, email, pass: pass ? '***' : '' });
    
    if(!name || !email || !pass) {
        alert('Заполните все поля');
        return;
    }
    
    const result = await signUp(email, pass, name);
    
    if(result.success) {
        console.log('Регистрация успешна!');
        currentUser = result.data;
        closeAuthModal();
        alert('Регистрация выполнена успешно!');
    } else {
        console.error('Ошибка регистрации:', result.error);
        alert('Ошибка регистрации: ' + result.error);
    }
}

// Делаем функции глобальными
window.openAuthModal = openAuthModal;
window.submitLogin = submitLogin;
window.submitRegister = submitRegister;
window.switchAuthModal = switchAuthModal;
window.closeAuthModal = closeAuthModal;

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', async function() {
    console.log('=== ЗАГРУЗКА ПРИЛОЖЕНИЯ ===');
    
    // Test Supabase connection
    testSupabaseConnection();
    
    console.log('=== ПРИЛОЖЕНИЕ ГОТОВО ===');
});
