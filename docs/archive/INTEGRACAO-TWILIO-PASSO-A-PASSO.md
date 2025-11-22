# Integração Twilio - Passo a Passo

## 📋 Visão Geral

Integração completa com Twilio para:
- **SMS** - Envio de OTP para login
- **WhatsApp** - Envio de OTP para login
- **Email** - Notificações de auditoria (login/logout)

## 🔧 Passo 1: Instalação

```bash
npm install twilio
npm install --save-dev @types/twilio
```

## 🔑 Passo 2: Variáveis de Ambiente

Adicionar ao `.env`:

```env
# Twilio Configuration
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890  # Número Twilio para SMS
TWILIO_WHATSAPP_NUMBER=whatsapp:+1234567890  # Número Twilio para WhatsApp
TWILIO_VERIFY_SERVICE_SID=your_verify_service_sid  # Opcional: Twilio Verify Service

# Email via Twilio SendGrid (ou outro provedor)
SENDGRID_API_KEY=your_sendgrid_api_key  # Se usar SendGrid via Twilio
# OU
RESEND_API_KEY=your_resend_api_key  # Se usar Resend
EMAIL_FROM=noreply@tna.studio
EMAIL_TO_AUDIT=token@zanin.art.br
WHATSAPP_TO_AUDIT=[redacted-phone]
```

## 📦 Passo 3: Criar Módulo de Integração

### Estrutura de Arquivos

```
src/lib/
├── twilio/
│   ├── index.ts          # Exportações principais
│   ├── sms.ts            # Funções de SMS
│   ├── whatsapp.ts       # Funções de WhatsApp
│   └── email.ts           # Funções de Email (via SendGrid/Resend)
```

### 3.1. SMS (`src/lib/twilio/sms.ts`)

```typescript
import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

if (!accountSid || !authToken || !phoneNumber) {
  console.warn("⚠️ Twilio SMS não configurado. Variáveis de ambiente faltando.");
}

const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

export interface SendSMSOptions {
  to: string; // Telefone no formato E.164
  message: string;
}

export async function sendSMS({ to, message }: SendSMSOptions): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  if (!client) {
    console.warn(`[Twilio SMS] MOCK: Enviaria SMS para ${to}: ${message}`);
    return { success: false, error: "Twilio não configurado" };
  }

  try {
    const result = await client.messages.create({
      body: message,
      from: phoneNumber!,
      to,
    });

    console.log(`[Twilio SMS] Enviado para ${to}: ${result.sid}`);
    return { success: true, messageId: result.sid };
  } catch (error: any) {
    console.error(`[Twilio SMS] Erro ao enviar para ${to}:`, error);
    return { success: false, error: error.message };
  }
}

export async function sendOTPviaSMS(to: string, otp: string): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  const message = `Seu código de acesso TNA Studio é: ${otp}. Válido por 5 minutos. Não compartilhe este código.`;
  return sendSMS({ to, message });
}
```

### 3.2. WhatsApp (`src/lib/twilio/whatsapp.ts`)

```typescript
import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;

if (!accountSid || !authToken || !whatsappNumber) {
  console.warn("⚠️ Twilio WhatsApp não configurado. Variáveis de ambiente faltando.");
}

const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

export interface SendWhatsAppOptions {
  to: string; // Telefone no formato E.164 (ex: +5511987654321)
  message: string;
}

export async function sendWhatsApp({ to, message }: SendWhatsAppOptions): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  if (!client) {
    console.warn(`[Twilio WhatsApp] MOCK: Enviaria WhatsApp para ${to}: ${message}`);
    return { success: false, error: "Twilio não configurado" };
  }

  try {
    // Garante que o número está no formato correto para WhatsApp
    const whatsappTo = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;

    const result = await client.messages.create({
      body: message,
      from: whatsappNumber!,
      to: whatsappTo,
    });

    console.log(`[Twilio WhatsApp] Enviado para ${to}: ${result.sid}`);
    return { success: true, messageId: result.sid };
  } catch (error: any) {
    console.error(`[Twilio WhatsApp] Erro ao enviar para ${to}:`, error);
    return { success: false, error: error.message };
  }
}

export async function sendOTPviaWhatsApp(to: string, otp: string): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  const message = `🔐 Seu código de acesso TNA Studio é: *${otp}*\n\n⏱️ Válido por 5 minutos\n\n⚠️ Não compartilhe este código.`;
  return sendWhatsApp({ to, message });
}
```

### 3.3. Email (`src/lib/twilio/email.ts`)

**Opção A: SendGrid (via Twilio)**

```typescript
import sgMail from "@sendgrid/mail";

const apiKey = process.env.SENDGRID_API_KEY;
const fromEmail = process.env.EMAIL_FROM || "noreply@tna.studio";

if (apiKey) {
  sgMail.setApiKey(apiKey);
}

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
}

export async function sendEmail({ to, subject, text, html }: SendEmailOptions): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  if (!apiKey) {
    console.warn(`[Email] MOCK: Enviaria email para ${to}: ${subject}`);
    return { success: false, error: "SendGrid não configurado" };
  }

  try {
    const msg = {
      to: Array.isArray(to) ? to : [to],
      from: fromEmail,
      subject,
      text,
      html: html || text.replace(/\n/g, "<br>"),
    };

    const result = await sgMail.send(msg);
    console.log(`[Email] Enviado para ${to}: ${result[0].statusCode}`);
    return { success: true, messageId: result[0].headers["x-message-id"] };
  } catch (error: any) {
    console.error(`[Email] Erro ao enviar para ${to}:`, error);
    return { success: false, error: error.message };
  }
}
```

**Opção B: Resend (recomendado para Next.js)**

```typescript
import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.EMAIL_FROM || "noreply@tna.studio";

const resend = apiKey ? new Resend(apiKey) : null;

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
}

export async function sendEmail({ to, subject, text, html }: SendEmailOptions): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  if (!resend) {
    console.warn(`[Email] MOCK: Enviaria email para ${to}: ${subject}`);
    return { success: false, error: "Resend não configurado" };
  }

  try {
    const result = await resend.emails.send({
      from: fromEmail,
      to: Array.isArray(to) ? to : [to],
      subject,
      text,
      html: html || text.replace(/\n/g, "<br>"),
    });

    console.log(`[Email] Enviado para ${to}: ${result.id}`);
    return { success: true, messageId: result.id };
  } catch (error: any) {
    console.error(`[Email] Erro ao enviar para ${to}:`, error);
    return { success: false, error: error.message };
  }
}
```

### 3.4. Index (`src/lib/twilio/index.ts`)

```typescript
export * from "./sms";
export * from "./whatsapp";
export * from "./email";
```

## 🔐 Passo 4: APIs de Autenticação

### 4.1. API de Envio SMS (`src/app/api/auth/sms/send/route.ts`)

```typescript
import { NextRequest, NextResponse } from "next/server";
import { sendOTPviaSMS } from "@/lib/twilio/sms";
import { generateOTP, getOTPExpiration } from "@/lib/otp";
import { validatePhoneE164, normalizePhoneE164 } from "@/lib/validators";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, email, cpf, passport } = body;

    // Valida telefone
    const normalizedPhone = normalizePhoneE164(phone);
    if (!normalizedPhone || !validatePhoneE164(normalizedPhone)) {
      return NextResponse.json(
        { error: "Telefone inválido. Use formato internacional (+CC DDD Nº)" },
        { status: 400 }
      );
    }

    // Valida email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 });
    }

    // Gera OTP
    const otp = generateOTP();
    const expiresAt = getOTPExpiration();

    // Obtém IP e User-Agent
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
               req.headers.get("x-real-ip") || 
               "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";

    // Salva OTP no banco
    await prisma.otpToken.create({
      data: {
        phone: normalizedPhone,
        email,
        cpf: cpf || null,
        passport: passport || null,
        otp,
        ip,
        userAgent,
        expiresAt,
      },
    });

    // Envia SMS via Twilio
    const smsResult = await sendOTPviaSMS(normalizedPhone, otp);

    if (!smsResult.success) {
      console.error(`[SMS Send] Falha ao enviar SMS: ${smsResult.error}`);
      return NextResponse.json(
        { error: "Erro ao enviar SMS. Tente novamente." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Código enviado por SMS",
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error: any) {
    console.error("[SMS Send] Erro:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao processar solicitação" },
      { status: 500 }
    );
  }
}
```

### 4.2. API de Verificação OTP (`src/app/api/auth/sms/verify/route.ts`)

```typescript
import { NextRequest, NextResponse } from "next/server";
import { validateOTPFormat, isOTPExpired } from "@/lib/otp";
import { prisma } from "@/lib/prisma";
import { signIn } from "next-auth/react";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, otp } = body;

    if (!phone || !otp) {
      return NextResponse.json(
        { error: "Telefone e OTP são obrigatórios" },
        { status: 400 }
      );
    }

    if (!validateOTPFormat(otp)) {
      return NextResponse.json(
        { error: "Formato de OTP inválido" },
        { status: 400 }
      );
    }

    // Busca OTP no banco
    const otpToken = await prisma.otpToken.findFirst({
      where: {
        phone,
        otp,
        verified: false,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!otpToken) {
      return NextResponse.json(
        { error: "Código inválido ou já utilizado" },
        { status: 401 }
      );
    }

    // Verifica expiração
    if (isOTPExpired(otpToken.expiresAt)) {
      return NextResponse.json(
        { error: "Código expirado. Solicite um novo código." },
        { status: 401 }
      );
    }

    // Marca OTP como verificado
    await prisma.otpToken.update({
      where: { id: otpToken.id },
      data: { verified: true },
    });

    // Busca ou cria usuário
    let user = await prisma.user.findUnique({
      where: { email: otpToken.email },
    });

    if (!user) {
      // Cria novo usuário (sign-up via SMS)
      user = await prisma.user.create({
        data: {
          email: otpToken.email,
          phone: otpToken.phone,
          cpf: otpToken.cpf,
          passport: otpToken.passport,
          name: otpToken.email.split("@")[0], // Nome temporário
          passwordHash: "", // Sem senha (login apenas por SMS/WhatsApp)
          role: "MODEL",
        },
      });
    }

    // Retorna sucesso (cliente fará login via NextAuth)
    return NextResponse.json({
      success: true,
      userId: user.id,
      email: user.email,
    });
  } catch (error: any) {
    console.error("[SMS Verify] Erro:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao verificar código" },
      { status: 500 }
    );
  }
}
```

## 📧 Passo 5: Sistema de Auditoria

### 5.1. Biblioteca de Auditoria (`src/lib/audit.ts`)

```typescript
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/twilio/email";
import { sendWhatsApp } from "@/lib/twilio/whatsapp";
import { Role } from "@prisma/client";

export interface AuditLogData {
  userId?: string;
  email: string;
  role?: Role;
  ip: string;
  userAgent: string;
  country?: string;
  city?: string;
  method: string; // SMS/WhatsApp/Password/2FA
  action: string; // login/signup/logout/session_expired
  sessionTime?: number;
  success?: boolean;
  errorMessage?: string;
}

export async function createAuditLog(data: AuditLogData) {
  try {
    const log = await prisma.auditLog.create({
      data: {
        userId: data.userId,
        email: data.email,
        role: data.role,
        ip: data.ip,
        userAgent: data.userAgent,
        country: data.country,
        city: data.city,
        method: data.method,
        action: data.action,
        sessionTime: data.sessionTime,
        success: data.success ?? true,
        errorMessage: data.errorMessage,
      },
    });

    // Envia notificações
    await sendAuditNotifications(data);

    return log;
  } catch (error: any) {
    console.error("[Audit] Erro ao criar log:", error);
    // Não falha a operação principal se o log falhar
  }
}

async function sendAuditNotifications(data: AuditLogData) {
  const emailTo = process.env.EMAIL_TO_AUDIT || "token@zanin.art.br";
  const whatsappTo = process.env.WHATSAPP_TO_AUDIT || "[redacted-phone]";

  const timestamp = new Date().toLocaleString("pt-BR");
  const location = data.city && data.country 
    ? `${data.city}, ${data.country}` 
    : "Localização não disponível";

  // Email
  const emailSubject = `TNA Studio - ${data.action === "login" ? "Novo Acesso" : "Logout"}: ${data.email}`;
  const emailText = `
TNA Studio - Notificação de ${data.action === "login" ? "Acesso" : "Logout"}

Usuário: ${data.email}
Role: ${data.role || "N/A"}
Método: ${data.method}
IP: ${data.ip}
Localização: ${location}
Navegador: ${data.userAgent}
Horário: ${timestamp}
${data.sessionTime ? `Tempo de sessão: ${data.sessionTime}s` : ""}
${data.errorMessage ? `Erro: ${data.errorMessage}` : ""}
  `.trim();

  await sendEmail({
    to: emailTo,
    subject: emailSubject,
    text: emailText,
  });

  // WhatsApp
  const whatsappMessage = `🔐 TNA Studio\n\n${data.action === "login" ? "✅ Novo acesso" : "🚪 Logout"}\n\n👤 ${data.email}\n📋 ${data.role || "N/A"}\n📱 ${data.method}\n🌍 ${location}\n🕐 ${timestamp}`;

  await sendWhatsApp({
    to: whatsappTo,
    message: whatsappMessage,
  });
}

// Limpeza automática (executar via cron job ou função serverless)
export async function cleanupOldAuditLogs() {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const result = await prisma.auditLog.deleteMany({
    where: {
      createdAt: {
        lt: sixMonthsAgo,
      },
    },
  });

  console.log(`[Audit] Limpeza: ${result.count} logs removidos (anteriores a 6 meses)`);
  return result.count;
}
```

## 🧪 Passo 6: Testes

### 6.1. Teste Manual

1. Configure variáveis de ambiente
2. Envie SMS de teste:
   ```bash
   curl -X POST http://localhost:3000/api/auth/sms/send \
     -H "Content-Type: application/json" \
     -d '{"phone":"+5511987654321","email":"test@example.com"}'
   ```
3. Verifique recebimento do SMS
4. Verifique OTP no banco de dados
5. Verifique logs de auditoria

## 📝 Passo 7: Documentação de Variáveis

Adicionar ao `README.md`:

```markdown
### Variáveis Twilio

- `TWILIO_ACCOUNT_SID` - Account SID da sua conta Twilio
- `TWILIO_AUTH_TOKEN` - Auth Token da sua conta Twilio
- `TWILIO_PHONE_NUMBER` - Número Twilio para SMS (formato E.164)
- `TWILIO_WHATSAPP_NUMBER` - Número Twilio para WhatsApp (formato: whatsapp:+1234567890)
- `SENDGRID_API_KEY` ou `RESEND_API_KEY` - Chave API para envio de emails
- `EMAIL_FROM` - Email remetente (ex: noreply@tna.studio)
- `EMAIL_TO_AUDIT` - Email para notificações de auditoria
- `WHATSAPP_TO_AUDIT` - WhatsApp para notificações de auditoria
```

---

**Status:** Documentação completa
**Próximo passo:** Implementar módulos conforme este guia

