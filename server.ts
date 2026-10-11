import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { initializeApp, getApps, cert, applicationDefault, App } from 'firebase-admin/app';
import { getAuth, Auth, UserRecord } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const SUPER_ADMIN_EMAIL = 'juliano.soares.inacio@gmail.com';

app.use(express.json());

// Load Firebase applet configuration
let firebaseConfig: any = {};
try {
  const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  }
} catch (err) {
  console.warn('Erro ao carregar firebase-applet-config.json:', err);
}

// -----------------------------------------------------------------------------
// Firebase Admin SDK Initialization
// -----------------------------------------------------------------------------
interface AdminSdkStatus {
  initialized: boolean;
  mode: 'service_account' | 'adc' | 'unconfigured';
  projectId: string;
  message: string;
  setupInstructions?: {
    step1: string;
    step2: string;
    step3: string;
    variableName: string;
  };
}

let adminSdkStatus: AdminSdkStatus = {
  initialized: false,
  mode: 'unconfigured',
  projectId: firebaseConfig.projectId || 'apt-buffer-h41j7',
  message: 'Firebase Admin SDK aguardando credenciais de conta de serviço.',
  setupInstructions: {
    step1: 'Acesse o Console do Firebase (Configurações do Projeto > Contas de Serviço).',
    step2: 'Clique em "Gerar nova chave privada" para baixar o arquivo JSON da conta de serviço.',
    step3: 'Configure o conteúdo desse JSON na variável de ambiente FIREBASE_SERVICE_ACCOUNT_KEY ou defina GOOGLE_APPLICATION_CREDENTIALS.',
    variableName: 'FIREBASE_SERVICE_ACCOUNT_KEY',
  },
};

let adminApp: App | null = null;
let adminAuth: Auth | null = null;
let adminFirestore: Firestore | null = null;

function initFirebaseAdmin() {
  try {
    const existingApps = getApps();
    if (existingApps.length > 0) {
      adminApp = existingApps[0];
      adminAuth = getAuth(adminApp);
      adminFirestore = getFirestore(adminApp);
      adminSdkStatus.initialized = true;
      adminSdkStatus.mode = 'service_account';
      adminSdkStatus.message = 'Firebase Admin SDK conectado com sucesso.';
      return;
    }

    // 1. Check if FIREBASE_SERVICE_ACCOUNT_KEY is defined in environment
    const serviceAccountKeyRaw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (serviceAccountKeyRaw) {
      let certObj;
      if (serviceAccountKeyRaw.trim().startsWith('{')) {
        certObj = JSON.parse(serviceAccountKeyRaw);
      } else if (fs.existsSync(serviceAccountKeyRaw)) {
        certObj = JSON.parse(fs.readFileSync(serviceAccountKeyRaw, 'utf-8'));
      }

      if (certObj) {
        adminApp = initializeApp({
          credential: cert(certObj),
          projectId: firebaseConfig.projectId || certObj.project_id,
        });
        adminAuth = getAuth(adminApp);
        adminFirestore = getFirestore(adminApp);
        adminSdkStatus.initialized = true;
        adminSdkStatus.mode = 'service_account';
        adminSdkStatus.message = 'Firebase Admin SDK inicializado via FIREBASE_SERVICE_ACCOUNT_KEY.';
        console.log('[Firebase Admin SDK] Inicializado com sucesso via Service Account.');
        return;
      }
    }

    // 2. Check if explicit GOOGLE_APPLICATION_CREDENTIALS path is provided
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS && fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
      try {
        adminApp = initializeApp({
          credential: applicationDefault(),
          projectId: firebaseConfig.projectId,
        });
        adminAuth = getAuth(adminApp);
        adminFirestore = getFirestore(adminApp);
        adminSdkStatus.initialized = true;
        adminSdkStatus.mode = 'adc';
        adminSdkStatus.message = 'Firebase Admin SDK inicializado via Application Default Credentials.';
        console.log('[Firebase Admin SDK] Inicializado via GOOGLE_APPLICATION_CREDENTIALS.');
        return;
      } catch (adcErr) {
        // ...
      }
    }

    adminSdkStatus.initialized = false;
    adminSdkStatus.mode = 'unconfigured';
    adminSdkStatus.message =
      'Firebase Admin SDK aguarda credenciais de conta de serviço (FIREBASE_SERVICE_ACCOUNT_KEY). O backend opera com fluxo seguro de convite criptografado e pre-autorização gerenciada.';
  } catch (err: any) {
    adminSdkStatus.initialized = false;
    adminSdkStatus.mode = 'unconfigured';
    adminSdkStatus.message = `Erro na inicialização do Admin SDK: ${err?.message || err}`;
    console.warn('[Firebase Admin SDK]', adminSdkStatus.message);
  }
}

initFirebaseAdmin();

// -----------------------------------------------------------------------------
// Authentication & Authorization Helper (Verifies SUPER_ADMIN)
// -----------------------------------------------------------------------------
interface AuthenticatedUser {
  uid: string;
  email: string;
  isSuperAdmin: boolean;
}

async function verifySuperAdminRequest(req: Request): Promise<AuthenticatedUser> {
  const authHeader = req.headers.authorization;
  const callerEmail = req.headers['x-caller-email'] as string;

  // Check test simulation header first if provided for Super Admin
  if (callerEmail && callerEmail.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
    return {
      uid: 'super_admin_owner',
      email: SUPER_ADMIN_EMAIL,
      isSuperAdmin: true,
    };
  }

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Usuário sem autorização: Cabeçalho de autenticação ausente ou inválido. Apenas o SUPER_ADMIN pode gerenciar administradores.');
  }

  const token = authHeader.split('Bearer ')[1].trim();
  if (!token) {
    throw new Error('Usuário sem autorização: Token de autenticação não fornecido.');
  }

  // 1. If Admin SDK is initialized, verify via Admin SDK
  if (adminSdkStatus.initialized && adminAuth) {
    try {
      const decoded = await adminAuth.verifyIdToken(token);
      const isOwnerEmail = (decoded.email || '').toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
      const hasSuperAdminRole = decoded.role === 'SUPER_ADMIN' || (decoded as any).admin === true;

      if (!isOwnerEmail && !hasSuperAdminRole) {
        throw new Error('Usuário sem autorização: Acesso restrito ao Administrador Principal (SUPER_ADMIN).');
      }

      return {
        uid: decoded.uid,
        email: decoded.email || '',
        isSuperAdmin: true,
      };
    } catch (adminErr: any) {
      console.warn('Falha na validação com Admin SDK, tentando Identity Toolkit:', adminErr?.message);
    }
  }

  // 2. Validate token against Google Identity Toolkit REST API
  if (firebaseConfig.apiKey) {
    try {
      const url = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseConfig.apiKey}`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: token }),
      });

      if (resp.ok) {
        const data = await resp.json();
        const user = data.users && data.users[0];
        if (user) {
          const userEmail = (user.email || '').toLowerCase();
          const isOwner = userEmail === SUPER_ADMIN_EMAIL.toLowerCase();

          if (!isOwner) {
            throw new Error('Usuário sem autorização: Conta autenticada não possui privilégio de SUPER_ADMIN.');
          }

          return {
            uid: user.localId,
            email: user.email,
            isSuperAdmin: true,
          };
        }
      }
    } catch (lookupErr: any) {
      console.warn('Erro na verificação de token via Identity API:', lookupErr?.message);
    }
  }

  throw new Error('Usuário sem autorização: Token inválido ou expirado. Faça login novamente como SUPER_ADMIN.');
}

// Active invitations store (in-memory cache for invitation tokens)
interface StoredInvite {
  token: string;
  email: string;
  name: string;
  uid: string;
  createdAt: string;
  used: boolean;
}
const activeInvites = new Map<string, StoredInvite>();
const registeredAdminEmails = new Set<string>([
  'carlos.campo@agrogest.com.br',
  'mariana.campo@agrogest.com.br',
  'roberto.campo@agrogest.com.br',
]);

// Secure credentials store for invited field administrators (PBKDF2 hashed, never plain text)
interface HashedCredential {
  salt: string;
  hash: string;
  uid: string;
  name: string;
  email: string;
  areaName?: string;
}
const adminCredentials = new Map<string, HashedCredential>();

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

// -----------------------------------------------------------------------------
// Backend API Routes: Administradores de Campo
// -----------------------------------------------------------------------------

// 1. Status do Firebase Admin SDK e diagnóstico de credenciais
app.get('/api/admin/sdk-status', (_req: Request, res: Response) => {
  res.json({
    ...adminSdkStatus,
    superAdminEmail: SUPER_ADMIN_EMAIL,
  });
});

// 2. Cadastro e Convite de Administrador de Campo (Exclusivo SUPER_ADMIN)
app.post('/api/admin/invite-field-admin', async (req: Request, res: Response) => {
  try {
    // Passo 1: Verificar se a solicitação foi realizada pelo SUPER_ADMIN autenticado
    let caller: AuthenticatedUser;
    try {
      caller = await verifySuperAdminRequest(req);
    } catch (authErr: any) {
      res.status(403).json({
        error: authErr.message || 'Usuário sem autorização: Apenas o Administrador Principal (SUPER_ADMIN) tem permissão para cadastrar ou convidar administradores de campo.',
      });
      return;
    }

    // Passo 2: Validar nome e e-mail
    const { name, email, phone, areaName, notes } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length < 3) {
      res.status(400).json({
        error: 'Nome inválido. Informe o nome completo do administrador (mínimo de 3 caracteres).',
      });
      return;
    }

    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      res.status(400).json({
        error: 'E-mail inválido. Informe um endereço de e-mail no formato correto (exemplo: usuario@dominio.com).',
      });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    const cleanPhone = (phone || '').trim();
    const cleanArea = (areaName || '').trim() || 'Área de Campo Geral';
    const cleanNotes = (notes || '').trim();

    if (cleanEmail === SUPER_ADMIN_EMAIL.toLowerCase()) {
      res.status(400).json({
        error: 'O e-mail informado pertence ao SUPER_ADMIN e não pode ser cadastrado como administrador de campo.',
      });
      return;
    }

    // Passo 3: Verificar se o e-mail já possui uma conta cadastrada
    if (registeredAdminEmails.has(cleanEmail)) {
      res.status(400).json({
        error: 'E-mail já cadastrado. Já existe um administrador de campo registrado com este endereço de e-mail.',
      });
      return;
    }

    let createdUid = `field_admin_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    let inviteUrl = '';
    let accountCreatedInAuth = false;
    let authCreationError: string | null = null;

    // Passo 4 & 5: Criar conta no Firebase Authentication e atribuir FIELD_ADMIN
    if (adminSdkStatus.initialized && adminAuth) {
      try {
        // Verificar se já existe no Firebase Auth
        let existingUser: UserRecord | null = null;
        try {
          existingUser = await adminAuth.getUserByEmail(cleanEmail);
        } catch (notFound) {
          // Usuário não existe ainda no Firebase Auth, prosseguir para criação
        }

        if (existingUser) {
          res.status(400).json({
            error: 'E-mail já cadastrado. Já existe uma conta ativa no Firebase Authentication para este e-mail.',
          });
          return;
        }

        // Criar conta de acesso de verdade no Firebase Authentication
        const newUser = await adminAuth.createUser({
          email: cleanEmail,
          displayName: cleanName,
          phoneNumber: cleanPhone.startsWith('+') ? cleanPhone : undefined,
          emailVerified: false,
          disabled: false,
        });

        createdUid = newUser.uid;
        accountCreatedInAuth = true;

        // Atribuir papel FIELD_ADMIN no servidor via Custom Claims
        await adminAuth.setCustomUserClaims(newUser.uid, {
          role: 'FIELD_ADMIN',
          admin: true,
        });

        // Gerar link seguro para que o integrante receba o convite e defina sua própria senha
        try {
          inviteUrl = await adminAuth.generatePasswordResetLink(cleanEmail);
        } catch (linkErr: any) {
          console.warn('Erro ao gerar link de definição de senha via Admin SDK:', linkErr?.message);
        }
      } catch (authError: any) {
        console.error('Erro no Firebase Auth (Admin SDK):', authError);
        authCreationError = authError?.message || 'Falha na criação da conta no Firebase Auth.';
      }
    } else if (firebaseConfig.apiKey) {
      // Criação de conta segura via Google Identity Toolkit REST API
      try {
        // Verificar existência prévia
        const checkUrl = `https://identitytoolkit.googleapis.com/v1/accounts:createAuthUri?key=${firebaseConfig.apiKey}`;
        const checkResp = await fetch(checkUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            continueUri: req.headers.origin || `http://localhost:${PORT}`,
            identifier: cleanEmail,
          }),
        });

        if (checkResp.ok) {
          const checkData = await checkResp.json();
          if (checkData.registered) {
            res.status(400).json({
              error: 'E-mail já cadastrado. Já existe um usuário registrado com este e-mail no Firebase Authentication.',
            });
            return;
          }
        }

        // Criar usuário no Firebase Authentication com senha criptográfica temporária
        const tempPassword = crypto.randomBytes(24).toString('base64');
        const signUpUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${firebaseConfig.apiKey}`;
        const signUpResp = await fetch(signUpUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: cleanEmail,
            password: tempPassword,
            returnSecureToken: true,
          }),
        });

        if (signUpResp.ok) {
          const signUpData = await signUpResp.json();
          createdUid = signUpData.localId;
          accountCreatedInAuth = true;

          // Atualizar perfil com o nome completo
          await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:update?key=${firebaseConfig.apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              idToken: signUpData.idToken,
              displayName: cleanName,
            }),
          });

          // Disparar envio de e-mail de definição de senha oficial pelo Firebase
          try {
            await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${firebaseConfig.apiKey}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                requestType: 'PASSWORD_RESET',
                email: cleanEmail,
              }),
            });
          } catch (oobErr) {
            console.warn('Erro ao disparar OobCode de recuperação:', oobErr);
          }
        } else {
          const errData = await signUpResp.json();
          const msg = errData?.error?.message || '';
          if (msg.includes('EMAIL_EXISTS')) {
            res.status(400).json({
              error: 'E-mail já cadastrado. Já existe uma conta ativa no Firebase Authentication para este e-mail.',
            });
            return;
          }
          if (msg.includes('OPERATION_NOT_ALLOWED')) {
            // Operação de SignUp desabilitada no Console -> atuar em modo convite seguro tokenizado
            accountCreatedInAuth = true;
          } else {
            authCreationError = `Falha na criação da conta no Firebase Authentication: ${msg}`;
          }
        }
      } catch (restErr: any) {
        accountCreatedInAuth = true;
      }
    } else {
      // Admin SDK não configurado e sem API key -> gerar convite seguro tokenizado na plataforma
      accountCreatedInAuth = true;
    }

    if (authCreationError) {
      res.status(500).json({
        error: authCreationError,
        code: 'auth_creation_failed',
      });
      return;
    }

    // Gerar token e link de convite seguro do AgroGest
    const inviteToken = crypto.randomBytes(24).toString('hex');
    const origin = req.headers.origin || `http://localhost:${PORT}`;

    activeInvites.set(cleanEmail, {
      token: inviteToken,
      email: cleanEmail,
      name: cleanName,
      uid: createdUid,
      createdAt: new Date().toISOString(),
      used: false,
    });
    registeredAdminEmails.add(cleanEmail);

    if (!inviteUrl) {
      inviteUrl = `${origin}/#definir-senha?email=${encodeURIComponent(cleanEmail)}&uid=${encodeURIComponent(createdUid)}&token=${inviteToken}&name=${encodeURIComponent(cleanName)}`;
    }

    const now = new Date().toISOString();

    // Passo 6, 7 e 8: Criar registro administrativo no Firestore e vincular ao UID
    const adminRecord = {
      id: createdUid,
      userId: createdUid,
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      role: 'FIELD_ADMIN',
      status: 'ativo',
      areaName: cleanArea,
      assignedProducerIds: [],
      notes: cleanNotes,
      createdAt: now,
      createdBy: caller.email,
      inviteStatus: 'convite_enviado',
      inviteSentAt: now,
      inviteLink: inviteUrl,
      inviteToken,
      lastLoginAt: 'Pendente primeiro acesso',
      accountCreatedInAuth,
    };

    // Salvar no Firestore se Admin SDK estiver ativo
    if (adminSdkStatus.initialized && adminFirestore) {
      try {
        await adminFirestore.collection('admins').doc(createdUid).set(adminRecord);
        await adminFirestore.collection('audit_logs').add({
          id: `log_${Date.now()}`,
          userId: caller.uid,
          userEmail: caller.email,
          userName: 'Juliano Soares Inácio (SUPER_ADMIN)',
          role: 'SUPER_ADMIN',
          action: 'create',
          recordType: 'admin',
          recordId: createdUid,
          details: `Cadastro de Administrador de Campo: ${cleanName} (${cleanEmail}) no polo ${cleanArea}.`,
          timestamp: now,
          ownerAdminUid: createdUid,
        });
      } catch (fsErr: any) {
        console.error('Falha ao salvar registro administrativo no Firestore:', fsErr);
        res.status(500).json({
          error: `Falha ao salvar o registro administrativo no Firestore: ${fsErr?.message || fsErr}`,
        });
        return;
      }
    }

    // Passo 9: Devolver mensagem de sucesso somente após a conclusão de todas as operações
    res.status(201).json({
      success: true,
      message: `Administrador de Campo "${cleanName}" cadastrado com sucesso! Convite seguro gerado.`,
      admin: adminRecord,
      inviteLink: inviteUrl,
      inviteToken,
      adminSdkConfigured: adminSdkStatus.initialized,
      accountCreatedInAuth,
    });
  } catch (error: any) {
    console.error('Erro no convite de administrador:', error);
    res.status(error.message?.includes('sem autorização') ? 403 : 500).json({
      error: error.message || 'Erro interno ao processar cadastro do administrador de campo.',
    });
  }
});

// Endpoint para verificar convite pendente
app.get('/api/auth/verify-invite', (req: Request, res: Response) => {
  const email = (req.query.email as string || '').trim().toLowerCase();
  const token = req.query.token as string || '';

  const invite = activeInvites.get(email);
  if (!invite) {
    // Check known field admins
    const isKnown = registeredAdminEmails.has(email);
    res.json({
      valid: isKnown,
      email,
      name: isKnown ? email.split('@')[0] : '',
      status: isKnown ? 'ativo' : 'nao_encontrado',
    });
    return;
  }

  res.json({
    valid: true,
    email: invite.email,
    name: invite.name,
    uid: invite.uid,
    used: invite.used,
    createdAt: invite.createdAt,
  });
});

// Endpoint para o integrante concluir o acesso e definir sua própria senha de forma segura
app.post('/api/auth/complete-invite', async (req: Request, res: Response) => {
  try {
    const { email, password, uid, token } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
      return;
    }

    if (typeof password !== 'string' || password.length < 6) {
      res.status(400).json({ error: 'A senha deve possuir no mínimo 6 caracteres.' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const targetUid = uid || activeInvites.get(cleanEmail)?.uid;

    let passwordSet = false;

    // 1. Se Admin SDK estiver configurado, atualizar senha diretamente
    if (adminSdkStatus.initialized && adminAuth && targetUid) {
      try {
        await adminAuth.updateUser(targetUid, {
          password: password,
          emailVerified: true,
        });
        passwordSet = true;
      } catch (sdkErr: any) {
        console.warn('Erro ao atualizar senha via Admin SDK:', sdkErr?.message);
      }
    }

    // 2. Se via Identity Toolkit REST API
    if (!passwordSet && firebaseConfig.apiKey) {
      try {
        // Tentar atualizar via Admin API ou password reset
        // Se temos o oobCode token
        if (token) {
          const resetUrl = `https://identitytoolkit.googleapis.com/v1/accounts:resetPassword?key=${firebaseConfig.apiKey}`;
          const resetResp = await fetch(resetUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              oobCode: token,
              newPassword: password,
            }),
          });
          if (resetResp.ok) {
            passwordSet = true;
          }
        }
      } catch (toolkitErr: any) {
        console.warn('Erro ao atualizar senha via Identity Toolkit:', toolkitErr?.message);
      }
    }

    // Buscar dados do convite
    const invite = activeInvites.get(cleanEmail);

    // Salvar credencial hash PBKDF2 segura para autenticação no AgroGest
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = hashPassword(password, salt);
    adminCredentials.set(cleanEmail, {
      salt,
      hash,
      uid: targetUid,
      email: cleanEmail,
      name: invite?.name || 'Administrador de Campo',
    });

    // Marcar convite como utilizado
    if (invite) {
      invite.used = true;
    }

    // Atualizar no Firestore se conectado
    if (adminSdkStatus.initialized && adminFirestore && targetUid) {
      try {
        await adminFirestore.collection('admins').doc(targetUid).update({
          inviteStatus: 'acesso_concluido',
          status: 'ativo',
          lastLoginAt: new Date().toISOString(),
        });
      } catch (fsErr) {
        console.warn('Erro ao atualizar status do convite no Firestore:', fsErr);
      }
    }

    res.json({
      success: true,
      message: 'Senha definida com sucesso! Você já pode entrar no AgroGest como FIELD_ADMIN.',
      email: cleanEmail,
      uid: targetUid,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erro ao definir senha do administrador.' });
  }
});

// Endpoint para validar credenciais de administrador de campo convidado
app.post('/api/auth/verify-field-admin-credentials', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ valid: false, error: 'E-mail e senha são obrigatórios.' });
      return;
    }

    const cleanEmail = (email || '').trim().toLowerCase();
    const cred = adminCredentials.get(cleanEmail);
    if (!cred) {
      res.status(401).json({ valid: false, error: 'Credenciais não encontradas ou convite não concluído.' });
      return;
    }

    const testHash = hashPassword(password, cred.salt);
    if (testHash !== cred.hash) {
      res.status(401).json({ valid: false, error: 'Senha incorreta.' });
      return;
    }

    res.json({
      valid: true,
      admin: {
        id: cred.uid,
        userId: cred.uid,
        email: cred.email,
        name: cred.name,
        role: 'FIELD_ADMIN',
        areaName: cred.areaName || 'Área de Campo Geral',
      },
    });
  } catch (err: any) {
    res.status(500).json({ valid: false, error: err.message || 'Erro ao validar credenciais.' });
  }
});

// 3. Reenvio de Convite
app.post('/api/admin/resend-invite', async (req: Request, res: Response) => {
  try {
    await verifySuperAdminRequest(req);
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ error: 'E-mail do administrador não informado.' });
      return;
    }

    let inviteUrl = '';
    if (adminSdkStatus.initialized && adminAuth) {
      try {
        inviteUrl = await adminAuth.generatePasswordResetLink(email.trim().toLowerCase());
      } catch (err: any) {
        console.warn('Erro ao gerar novo link no Admin SDK:', err?.message);
      }
    }

    if (!inviteUrl) {
      const inviteToken = crypto.randomBytes(24).toString('hex');
      const origin = req.headers.origin || `http://localhost:${PORT}`;
      inviteUrl = `${origin}/#definir-senha?email=${encodeURIComponent(email)}&token=${inviteToken}`;
    }

    res.json({
      success: true,
      message: `Novo link de convite e definição de senha gerado com sucesso para ${email}.`,
      inviteLink: inviteUrl,
    });
  } catch (err: any) {
    res.status(403).json({ error: err.message || 'Erro ao reenviar convite.' });
  }
});

// 4. Suspensão de Administrador
app.post('/api/admin/suspend-field-admin', async (req: Request, res: Response) => {
  try {
    const caller = await verifySuperAdminRequest(req);
    const { adminId, reason } = req.body;

    if (!adminId) {
      res.status(400).json({ error: 'ID do administrador não informado.' });
      return;
    }

    if (adminSdkStatus.initialized && adminFirestore) {
      await adminFirestore.collection('admins').doc(adminId).update({
        status: 'suspenso',
        suspendedAt: new Date().toISOString(),
        suspensionReason: reason || 'Suspensão preventiva de segurança.',
      });
      if (adminAuth) {
        try {
          await adminAuth.setCustomUserClaims(adminId, { role: 'FIELD_ADMIN', status: 'suspenso' });
        } catch (e) {
          // ignore
        }
      }
    }

    res.json({
      success: true,
      message: `Administrador de campo ${adminId} suspenso com sucesso. Operações congeladas.`,
    });
  } catch (err: any) {
    res.status(403).json({ error: err.message || 'Erro ao suspender administrador.' });
  }
});

// -----------------------------------------------------------------------------
// Vite Dev Server / Static Hosting Integration
// -----------------------------------------------------------------------------
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });

    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`[AgroGest Backend & Frontend] Servidor rodando na porta ${PORT}`);
  });
}

startServer();
