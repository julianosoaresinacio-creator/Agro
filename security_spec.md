# Security Specification - AgroGest

## 1. Data Invariants
- Cada documento nas coleções (`users`, `properties`, `production`, `costs`, `inventory`, `sales`, `customers`, `suppliers`) pertence estritamente ao usuário autenticado identificado pelo campo `userId == request.auth.uid`.
- Um produtor NUNCA pode ler, criar, modificar ou apagar registros de outro produtor (`isOwner(userId)`).
- O papel de administrador (ADMIN) é estritamente validado por mecanismos confiáveis no servidor (Firebase Custom Claims `token.role == 'ADMIN'` ou `token.admin == true`, e-mail administrativo pré-autorizado ou documento confiável em `/admins/{uid}`).
- Nenhum usuário pode se auto-promover a administrador (`allow write: if false` em `/admins`).
- Visitantes sem papel ADMIN operam estritamente em modo de consulta (demonstração): todas as escritas no banco são sumariamente rejeitadas por regras do Firestore.
- Campos imutáveis (`userId`, `createdAt`) não podem ser alterados após a criação.
- Operações de `list` requerem autenticação e validação estrita de posse (`resource.data.userId == request.auth.uid || isAdmin()`), impedindo vazamento de dados entre produtores rurais.
- Textos e descrições possuem limites estritos de tamanho para evitar ataques de esgotamento de cota ("Denial of Wallet").

## 2. The "Dirty Dozen" Payloads (Rejected Security Test Payloads)
1. **Ghost Tenant Create**: Payload em `/production` com `userId: 'attacker_123'` submetido por `user_abc`. (Rejeitado: `request.auth.uid != incoming().userId`).
2. **PII Hijack Profile**: Payload em `/users/other_farmer` tentando sobrescrever o perfil de outro produtor. (Rejeitado: `request.auth.uid != userId`).
3. **Ghost Attribute Injection**: Payload em `/sales` com campo não permitido `isSuperAdmin: true`. (Rejeitado: validação de chaves).
4. **Self-Promote to Admin**: Usuário não-admin tentando criar doc em `/admins/my_uid` com `{ role: 'ADMIN' }`. (Rejeitado: `allow write: if false` em `/admins`).
5. **Visitor Write Attempt**: Visitante desautenticado ou não-admin tentando criar despesa em `/costs`. (Rejeitado: `isAdmin()` e `isSignedIn()`).
6. **Denial of Wallet Long String**: Payload com `product` contendo string de 50.000 caracteres. (Rejeitado: `size() <= 150`).
7. **Negative Cost Amount**: Payload com `amount` NaN ou string no lugar de número positivo. (Rejeitado: tipo estrito de `amount is number`).
8. **Immortal Field Tamper**: Tentativa de update alterando `userId` ou `createdAt` original em `/inventory`. (Rejeitado: campos imutáveis).
9. **Blanket Query Snoop**: Query `list` em `/costs` sem filtro de `userId`. (Rejeitado: `resource.data.userId == request.auth.uid`).
10. **Negative Inventory Stock**: Payload com `currentQuantity` inválido. (Rejeitado: verificação de tipo numérico).
11. **ID Poisoning Path**: Tentativa de criar documento com ID contendo caracteres inválidos ou comprimento excessivo > 128 chars. (Rejeitado: `isValidId(docId)`).
12. **Cross-Customer Data Delete**: Tentativa de `delete` em `/suppliers/{supplierId}` onde `resource.data.userId != request.auth.uid`. (Rejeitado: `isDocOwner() || isAdmin()`).
