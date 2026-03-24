# E-Cards Corporate Admin Panel

A production-ready admin panel for managing e-cards, submissions, users, translations, and contact messages. Built with Vite, React, TypeScript, Tailwind CSS, and Supabase.

## Technology Stack

- **Frontend Framework**: React 18.3
- **Build Tool**: Vite 5.4
- **Language**: TypeScript 5.5
- **Styling**: Tailwind CSS 3.4
- **Backend**: Supabase (PostgreSQL)
- **UI Components**: lucide-react 0.344
- **Routing**: react-router-dom

## Features

### Dashboard
- Real-time statistics (total e-cards, views, likes, new messages)
- Quick overview of platform metrics

### E-Cards Management
- List and search all e-cards
- Filter by publication status
- Full CRUD operations
- Edit detailed card information
- Tag management
- Admin scoring (0-5)
- Publish/feature toggles

### Submissions
- View all e-card submissions
- Track submission status (new, pending, approved, rejected)
- Filter and search submissions
- View detailed submission information
- Update submission status

### Admin Users
- Add new admin users
- List all administrators
- Remove admin access

### Translations
- Manage translation keys
- Multi-language support
- Bulk translation editor
- Add/delete translation keys

### Contact Messages
- View all contact form submissions
- Search and filter messages
- Mark messages as read/replied
- Delete messages
- Message detail view with contact information

## Setup Instructions

### Prerequisites
- Node.js 16+ and npm
- Supabase project with database tables configured

### Installation

1. Clone or extract the project
2. Install dependencies:
```bash
npm install
```

3. Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

4. Add your Supabase credentials:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Production Build

Build for production:
```bash
npm run build
```

Preview the build locally:
```bash
npm run preview
```

## Database Schema

The admin panel expects the following Supabase tables:

### e_cards
Main e-card data table with fields for advertiser info, content, statistics, and metadata.

### ecard_submissions
User submissions for new e-cards with approval workflow.

### admin_users
List of authorized administrators with email and audit fields.

### languages
Available languages for translations with active/default flags.

### translation_keys
Translation key definitions with context information.

### translations
Actual translation values linked to keys and languages.

### contact_messages
Contact form submissions with status tracking.

## Authentication

The admin panel uses Supabase email/password authentication. Users must:
1. Have a valid Supabase auth account
2. Be registered in the `admin_users` table

## Project Structure

```
src/
├── components/
│   ├── Layout.tsx          # Sidebar navigation and main layout
│   └── ProtectedRoute.tsx   # Route protection with auth check
├── pages/
│   ├── Login.tsx            # Authentication page
│   ├── Dashboard.tsx        # Statistics and overview
│   ├── ECards.tsx           # E-cards list and management
│   ├── ECardEdit.tsx        # E-card editor
│   ├── Submissions.tsx      # Submission list
│   ├── SubmissionDetail.tsx # Submission detail view
│   ├── Users.tsx            # Admin users management
│   ├── Translations.tsx     # Translation management
│   └── Messages.tsx         # Contact messages
├── lib/
│   ├── supabase.ts          # Supabase client and helpers
│   └── types.ts             # TypeScript interfaces
├── App.tsx                  # Main router component
├── main.tsx                 # Application entry point
└── index.css                # Global styles
```

## Key Features Detail

### Authentication
- Email/password login via Supabase
- Admin verification from `admin_users` table
- Session persistence
- Protected routes

### UI/UX
- Dark navy theme (#1a1b2e background)
- Responsive design (mobile and desktop)
- Mobile sidebar menu
- Lucide React icons throughout
- French language interface

### Data Management
- Real-time data fetching with Supabase
- Form validation
- Error handling with user feedback
- Loading states
- Confirmation dialogs for destructive actions

## Deployment

The application can be deployed to any static hosting service:

1. Build the project: `npm run build`
2. Deploy the `dist` folder to your hosting service
3. Ensure environment variables are set in your deployment platform
4. Point your domain to the deployment

### Popular Deployment Options
- Vercel
- Netlify
- Firebase Hosting
- AWS S3 + CloudFront
- GitHub Pages

## Security Notes

- Keep your Supabase credentials secure
- Use environment variables for sensitive data
- The anon key has limited access via RLS (Row Level Security)
- Enable RLS on all tables in Supabase
- Validate user roles on the backend

## Troubleshooting

### Authentication Issues
- Verify Supabase credentials in `.env`
- Check that the user exists in `admin_users` table
- Ensure Supabase auth is enabled

### Database Connection
- Confirm Supabase URL and API key are correct
- Check that tables exist in your Supabase project
- Verify RLS policies allow admin user access

### Build Issues
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version is 16+
- Ensure TypeScript compiles without errors: `npm run build`

## Performance Optimization

- Code splitting via Vite
- Lazy loading for routes
- Optimized bundle size
- Efficient database queries

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

This project is proprietary software for E-Cards Corporate.

## Support

For issues or questions, contact the development team.
