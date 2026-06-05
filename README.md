# Quaestor Client UI (Frontend)

Client UI to interact with the Quaestor expense tracking service.

## How to Run the Project Locally

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   Create a `.env` file in the root directory and define `VITE_API_URL` to point to your backend service (local or cloud):
   ```env
   VITE_API_URL=http://localhost:3001
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

## Future Improvements & UX enhancements

- **UX for Monthly Budget**: Improve the visual clarity and interactive flow for setting and editing the monthly budget.
- **Onboarding Flow Placement**: Restructure the positioning of the "Create Family Group" feature to make it more intuitive during onboarding.
- **Mobile Optimization**: Optimize the layout and responsive design to support mobile device interfaces.

---

## Test Account Credentials

The database has been seeded with the following test accounts:

### 1. Main Demo Account
- **Name**: Omveer Singh
- **Email**: `omveer@quaestor.app`
- **Username**: `omveer99`
- **Password**: `omveer123`

### 2. Seeded Family Group Members
All three users below are part of the **"Doe & Friends Family"** group and have active transactions loaded.
- **User 1 (Admin/Creator)**:
  - **Name**: John Doe
  - **Email**: `john@quaestor.app`
  - **Username**: `johndoe`
  - **Password**: `password123`
- **User 2**:
  - **Name**: Mary Smith
  - **Email**: `mary@quaestor.app`
  - **Username**: `marysmith`
  - **Password**: `password123`
- **User 3**:
  - **Name**: David Jones
  - **Email**: `david@quaestor.app`
  - **Username**: `davidjones`
  - **Password**: `password123`
