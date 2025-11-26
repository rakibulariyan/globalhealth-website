<div align="center">

<img src="assets/logo.png" width="130" alt="Global Health Logo">

<h1><strong>Global Health Mission</strong></h1>
<h3>Membership Management System</h3>

<p>A robust, scalable health-membership management system built with <strong>Supabase</strong>, <strong>AdminLTE</strong>, and <strong>vanilla JavaScript</strong>.</p>

<!-- Badges -->
<p>
  <img src="https://img.shields.io/badge/Status-Active-brightgreen?style=for-the-badge">
  <img src="https://img.shields.io/badge/Tech-Supabase-lightgrey?style=for-the-badge&logo=supabase">
  <img src="https://img.shields.io/badge/Frontend-HTML%20%7C%20CSS%20%7C%20JS-blue?style=for-the-badge">
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge">
</p>

<hr width="60%">
</div>

---

## 🚀 Overview

This platform is designed for NGOs, health organizations, and field teams who need a **fast, secure, and paperless system** to manage:

- Member registration  
- Family beneficiaries  
- Employee roles & permissions  
- Payments & receipts  
- Reports & analytics  
- QR-based member validation  
- Auto-generated PDF health cards  

Built entirely with client-side technologies + Supabase backend.


## ✨ Features

<table>
<tr>
<td width="50%" valign="top">

### **Authentication & Access**
- Supabase Auth (Email/Password)
- Role-Based UI:
  - Admin  
  - Employee  
  - Accountant  
  - Health Worker  

### **Member Management**
- Register new members  
- Upload applicant photo  
- Add up to 4 beneficiaries  
- Auto Member ID  
- Edit / Update / Renew  
- Status: Active / Expired  

</td>

<td width="50%" valign="top">

### **Payments**
- Track payment entries  
- Filter by date, district, collector  
- Payment dashboard widget  

### **PDF Tools**
- PDF Membership Card  
- PDF Invoice / Receipt  
- Powered by jsPDF + html2canvas  

### **Reports & Analytics**
- Monthly Sign-ups  
- District-wise analytics  
- Payments chart  
- Member status chart  

</td>
</tr>
</table>


## 🧱 Tech Stack

<div align="center">

| Layer | Technologies |
|------|--------------|
| Frontend | HTML, CSS, JavaScript, AdminLTE |
| Backend | Supabase (Auth, DB, RLS, Storage) |
| Charts | Chart.js |
| QR | QRCode.js |
| PDF | jsPDF, html2canvas |

</div>


## 📦 Folder Structure
/
├─ index.html
├─ styles/
│  └─ style.css
├─ js/
│  ├─ supabase-config.js
│  ├─ app.js
│  └─ pdf-generator.js
├─ assets/
│  └─ images/logo.png
└─ README.md


---

## 🔧 Setup Instructions

### 1. Clone the repository
```sh
git clone <repo-url>
cd project-folder

2. Configure Supabase

Edit:

js/supabase-config.js


Add:

SUPABASE_URL

SUPABASE_ANON_KEY

3. Run locally

Open:

index.html


No build tools, no bundlers required.

🌍 Deployment
GitHub Pages

Enable Pages → Deploy from root

Netlify

Drop your folder → Instant deployment

Vercel

Import repo

Add environment variables

Deploy

🔒 Environment Variables (Hosted version)
SUPABASE_URL=
SUPABASE_ANON_KEY=


Never expose service_role keys.

📜 License

This project is licensed under the MIT License.

MIT License

Copyright (c) 2024 Global Health Mission

Permission is hereby granted, free of charge, to any person obtaining a copy...
