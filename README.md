# 📋 Controle de Chamados

![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![Vite](https://img.shields.io/badge/Vite-Fast-yellow?style=for-the-badge&logo=vite)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

> Um sistema de gerenciamento de produtividade focado no controle de chamados (WO), monitoramento de metas diárias e geração de relatórios mensais de desempenho.

### 📸 Demonstração

<div align="center">
  <img src="https://via.placeholder.com/1200x600?text=Print+do+Controle+de+Chamados" width="100%" alt="Dashboard Screenshot" />
</div>

---

### ✨ Funcionalidades

* **🎯 Metas e Gamificação:**
    * Barra de progresso diária com meta configurável.
    * Animação de confetes ao atingir o objetivo do dia.
* **📝 Gestão de Chamados:**
    * Cadastro rápido com WO e UF.
    * Classificação por status (Concluído, Diagnóstico, Trabalhado, Cancelado).
    * Marcação específica para atendimentos presenciais.
* **📊 Relatórios Inteligentes:**
    * Geração automática de métricas mensais (Total, Média Diária, Remoto vs. Presencial).
    * **Exportação para CSV** para uso em planilhas.
* **💾 Persistência de Dados:**
    * Salvamento automático no armazenamento local (LocalStorage).
    * Sistema de **Backup** (Importar e Exportar JSON) para migração de dados entre dispositivos.
* **🔍 Filtros e Busca:** Pesquisa em tempo real por número da WO e filtros por status.

---

### 🛠️ Tecnologias Utilizadas

* **[React 19](https://react.dev/)** - Biblioteca para construção da interface.
* **[TypeScript](https://www.typescriptlang.org/)** - Tipagem estática para segurança do código.
* **[Vite](https://vitejs.dev/)** - Build tool de alta performance.
* **[CSS3](https://developer.mozilla.org/en-US/docs/Web/CSS)** - Estilização com variáveis CSS e design responsivo.

---

### 🚀 Como rodar o projeto

#### 1. Clone o repositório
```bash
git clone [https://github.com/devsilvver/controle-de-chamados.git](https://github.com/devsilvver/controle-de-chamados.git)
cd controle-de-chamados
```

#### 2. Instale as dependências
```bash
npm install
```

#### 3. Execute o projeto
```bash
npm run dev
```
O sistema estará disponível em `http://localhost:3000`.

---

### 📂 Estrutura do Projeto

```text
src/
├── index.tsx         # Lógica principal (Estado, Cálculos, Renderização)
├── index.css         # Estilos globais e temas
├── index.html        # Ponto de entrada
├── img/              # Assets (Banner)
└── vite.config.ts    # Configuração do Vite
```

---

### 👤 Autor

Feito por **Guilherme Silvestrini**.

<a href="https://www.linkedin.com/in/guilherme-silvestrini-782226233/" target="_blank">
 <img src="https://img.shields.io/badge/-LinkedIn-%230077B5?style=for-the-badge&logo=linkedin&logoColor=white" target="_blank">
</a>
<a href="mailto:contatosilvestrini@gmail.com">
 <img src="https://img.shields.io/badge/-Gmail-%23D14836?style=for-the-badge&logo=gmail&logoColor=white" target="_blank">
</a>