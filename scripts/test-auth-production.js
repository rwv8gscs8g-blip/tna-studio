#!/usr/bin/env node

/**
 * Script de Testes Automatizados - Autenticação em Produção
 * 
 * Testa login, logout e validação de sessão no ambiente de produção
 * Usa o fluxo correto do NextAuth v5
 */

const BASE_URL = process.env.PRODUCTION_URL || 'https://tna-studio.vercel.app';

const USERS = {
  admin: { email: 'admin@tna.studio', password: 'Admin@2025!', role: 'ADMIN' },
  model: { email: 'model1@tna.studio', password: 'Model1@2025!', role: 'MODEL' },
  client: { email: 'client1@tna.studio', password: 'Client1@2025!', role: 'CLIENT' },
};

let results = {
  passed: 0,
  failed: 0,
  errors: [],
};

function log(message, type = 'info') {
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
  console.log(`${prefix} ${message}`);
}

/**
 * Obtém CSRF token do NextAuth
 */
async function getCsrfToken() {
  try {
    const response = await fetch(`${BASE_URL}/api/auth/csrf`);
    if (!response.ok) {
      throw new Error(`CSRF token failed: ${response.status}`);
    }
    const data = await response.json();
    return data.csrfToken;
  } catch (error) {
    log(`Erro ao obter CSRF token: ${error.message}`, 'error');
    return null;
  }
}

/**
 * Faz login usando NextAuth v5
 */
async function testLogin(userKey) {
  const user = USERS[userKey];
  log(`Testando login: ${user.email}`, 'info');
  
  try {
    // 1. Obtém CSRF token
    const csrfToken = await getCsrfToken();
    if (!csrfToken) {
      log(`Não foi possível obter CSRF token para ${user.email}`, 'error');
      results.failed++;
      results.errors.push(`CSRF token falhou para ${user.email}`);
      return null;
    }

    // 2. Faz login
    const response = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      redirect: 'manual', // Não seguir redirects automaticamente
      body: new URLSearchParams({
        email: user.email,
        password: user.password,
        csrfToken: csrfToken,
        callbackUrl: `${BASE_URL}/`,
        json: 'true',
      }),
    });

    // NextAuth pode retornar 200 com JSON ou 302/307 com redirect
    const contentType = response.headers.get('content-type');
    let cookies = response.headers.get('set-cookie') || '';
    
    // Se houver redirect, tenta seguir
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (location && location.includes('error')) {
        log(`Login falhou: ${user.email} (redirect para erro)`, 'error');
        results.failed++;
        results.errors.push(`Login falhou para ${user.email}: redirect para erro`);
        return null;
      }
      // Redirect de sucesso - verifica se tem cookie de sessão
      if (cookies.includes('session-token') || cookies.includes('__Secure-next-auth.session-token')) {
        log(`Login bem-sucedido: ${user.email} (via redirect)`, 'success');
        results.passed++;
        return cookies;
      }
    }

    // Tenta parsear JSON se disponível
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      if (data.error) {
        log(`Login falhou: ${user.email} - ${data.error}`, 'error');
        results.failed++;
        results.errors.push(`Login falhou para ${user.email}: ${data.error}`);
        return null;
      }
      if (data.url && !data.url.includes('error')) {
        log(`Login bem-sucedido: ${user.email}`, 'success');
        results.passed++;
        return cookies;
      }
    }

    // Verifica se tem cookie de sessão mesmo sem JSON
    if (cookies.includes('session-token') || cookies.includes('__Secure-next-auth.session-token')) {
      log(`Login bem-sucedido: ${user.email} (cookie presente)`, 'success');
      results.passed++;
      return cookies;
    }

    log(`Login falhou: ${user.email} (status: ${response.status})`, 'error');
    results.failed++;
    results.errors.push(`Login falhou para ${user.email}: status ${response.status}`);
    return null;
  } catch (error) {
    log(`Erro no teste de login: ${error.message}`, 'error');
    results.failed++;
    results.errors.push(`Erro no login de ${user.email}: ${error.message}`);
    return null;
  }
}

/**
 * Testa acesso a rota protegida
 */
async function testProtectedRoute(cookies, userKey) {
  const user = USERS[userKey];
  log(`Testando acesso a rota protegida: ${user.email}`, 'info');
  
  try {
    // Extrai cookie de sessão do header Set-Cookie
    let cookieHeader = '';
    if (cookies) {
      // Parseia cookies do formato Set-Cookie
      const cookieMatches = cookies.match(/([^=]+)=([^;]+)/g);
      if (cookieMatches) {
        cookieHeader = cookieMatches.map(c => c.split(';')[0]).join('; ');
      }
    }

    const response = await fetch(`${BASE_URL}/api/galleries`, {
      method: 'GET',
      headers: {
        'Cookie': cookieHeader,
      },
      redirect: 'manual',
    });

    if (response.status === 401 || response.status === 403) {
      log(`Acesso negado (esperado se não autenticado): ${user.email}`, 'info');
      return false;
    }

    if (response.ok) {
      log(`Acesso permitido: ${user.email}`, 'success');
      results.passed++;
      return true;
    } else {
      log(`Acesso falhou (${response.status}): ${user.email}`, 'error');
      results.failed++;
      results.errors.push(`Acesso falhou para ${user.email}: ${response.status}`);
      return false;
    }
  } catch (error) {
    log(`Erro no teste de acesso: ${error.message}`, 'error');
    results.failed++;
    results.errors.push(`Erro no acesso de ${user.email}: ${error.message}`);
    return false;
  }
}

/**
 * Testa acesso sem autenticação
 */
async function testUnauthenticatedAccess() {
  log('Testando acesso sem autenticação', 'info');
  
  try {
    const response = await fetch(`${BASE_URL}/api/galleries`, {
      method: 'GET',
      redirect: 'manual',
    });

    if (response.status === 401 || response.status === 403 || response.status === 307 || response.status === 302) {
      log('Acesso negado corretamente (sem autenticação)', 'success');
      results.passed++;
      return true;
    } else {
      log(`Acesso permitido sem autenticação (ERRO DE SEGURANÇA): ${response.status}`, 'error');
      results.failed++;
      results.errors.push('Acesso permitido sem autenticação - ERRO DE SEGURANÇA');
      return false;
    }
  } catch (error) {
    log(`Erro no teste: ${error.message}`, 'error');
    results.failed++;
    results.errors.push(`Erro no teste de acesso não autenticado: ${error.message}`);
    return false;
  }
}

/**
 * Testa headers de segurança
 */
async function testSecurityHeaders() {
  log('Testando headers de segurança', 'info');
  
  try {
    const response = await fetch(`${BASE_URL}/`, {
      method: 'GET',
      redirect: 'manual',
    });

    const headers = {
      'x-content-type-options': response.headers.get('x-content-type-options'),
      'x-frame-options': response.headers.get('x-frame-options'),
      'x-xss-protection': response.headers.get('x-xss-protection'),
      'referrer-policy': response.headers.get('referrer-policy'),
    };

    const missing = Object.entries(headers)
      .filter(([_, value]) => !value)
      .map(([key]) => key);

    if (missing.length === 0) {
      log('Headers de segurança presentes', 'success');
      results.passed++;
      return true;
    } else {
      log(`Headers de segurança faltando: ${missing.join(', ')}`, 'error');
      results.failed++;
      results.errors.push(`Headers faltando: ${missing.join(', ')}`);
      return false;
    }
  } catch (error) {
    log(`Erro no teste de headers: ${error.message}`, 'error');
    results.failed++;
    results.errors.push(`Erro no teste de headers: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('\n🧪 Iniciando testes de autenticação em produção...\n');
  console.log(`URL Base: ${BASE_URL}\n`);

  // Teste 1: Acesso sem autenticação
  await testUnauthenticatedAccess();
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Teste 2: Headers de segurança
  await testSecurityHeaders();
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Teste 3: Login de cada usuário
  for (const userKey of Object.keys(USERS)) {
    const cookies = await testLogin(userKey);
    if (cookies) {
      await new Promise(resolve => setTimeout(resolve, 500));
      await testProtectedRoute(cookies, userKey);
    }
    // Aguarda 2 segundos entre testes
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Resumo
  console.log('\n📊 Resumo dos Testes:\n');
  console.log(`✅ Passou: ${results.passed}`);
  console.log(`❌ Falhou: ${results.failed}`);
  const total = results.passed + results.failed;
  if (total > 0) {
    console.log(`📈 Taxa de sucesso: ${((results.passed / total) * 100).toFixed(1)}%\n`);
  }

  if (results.errors.length > 0) {
    console.log('❌ Erros encontrados:\n');
    results.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error}`);
    });
    console.log('');
  }

  process.exit(results.failed > 0 ? 1 : 0);
}

// Executa testes
runTests().catch(error => {
  console.error('Erro fatal:', error);
  process.exit(1);
});
