# 🐕 Puppy Activity Tracker

A mobile-first Progressive Web App (PWA) for tracking puppy activities with photo uploads. Keep track of your puppy's poop, pee, meals, crying episodes, and more with timestamps and optional photos.

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/philipyong/puppy-activity-tracker)

## ✨ Features

- **📱 Mobile-First Design**: Optimized for smartphone use
- **🔄 PWA Support**: Install as an app on your phone
- **📊 Activity Tracking**: Log poop, pee, meals, and crying
- **📸 Photo Uploads**: Attach photos to activities
- **🔐 Authentication**: Secure user accounts with email verification
- **☁️ Cloud Sync**: Data synchronized across devices
- **📈 Analytics**: Daily and weekly activity summaries
- **🎨 Modern UI**: Clean, intuitive interface with shadcn/ui
- **🌙 Dark Mode**: Automatic dark/light theme support

## 🚀 Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage for photos
- **PWA**: Next.js PWA capabilities
- **Package Manager**: Bun

## 📦 Installation

### Prerequisites

- Node.js 18+ or Bun
- Supabase account (free tier available)

### 1. Clone the repository

```bash
git clone https://github.com/philipyong/puppy-activity-tracker.git
cd puppy-activity-tracker
```

### 2. Install dependencies

```bash
bun install
```

### 3. Set up Supabase

Follow the detailed setup guide in [SUPABASE_SETUP.md](SUPABASE_SETUP.md) to:
- Create a Supabase project
- Set up the database schema
- Configure authentication
- Set up file storage

### 4. Configure environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 5. Run the development server

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## 🎯 Usage

1. **Create Account**: Sign up with email and verify your account
2. **Log Activities**: Use the quick action buttons to log activities
3. **Add Photos**: Tap the camera icon to attach photos to activities
4. **View History**: Browse past activities in the timeline
5. **Track Progress**: Monitor patterns and trends

## 📱 PWA Installation

### iOS Safari
1. Open the app in Safari
2. Tap the Share button
3. Select "Add to Home Screen"

### Android Chrome
1. Open the app in Chrome
2. Tap the menu (three dots)
3. Select "Add to Home Screen"

## 🛠️ Development

### Available Scripts

```bash
bun run dev          # Start development server
bun run build        # Build for production
bun run start        # Start production server
bun run lint         # Run TypeScript and ESLint checks
bun run format       # Format code with Biome
```

### Database Schema

The app uses the following main tables:
- `profiles` - User profile information
- `activities` - Activity records with timestamps
- `activity_photos` - Photo attachments for activities

See the migration files in `supabase/migrations/` for the complete schema.

### File Structure

```
src/
├── app/              # Next.js app router pages
├── components/       # React components
│   └── ui/          # shadcn/ui components
├── hooks/           # Custom React hooks
├── lib/             # Utility functions
└── types/           # TypeScript type definitions
```

## 🚀 Deployment

### Deploy to Netlify

1. Click the "Deploy to Netlify" button above
2. Connect your GitHub account
3. Configure environment variables in Netlify dashboard
4. Deploy!

### Manual Deployment

1. Build the project:
   ```bash
   bun run build
   ```

2. Deploy the `out/` directory to your hosting provider

### Environment Variables for Production

Make sure to set these environment variables in your hosting platform:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🆘 Support

If you encounter any issues:

1. Check the [SUPABASE_SETUP.md](SUPABASE_SETUP.md) guide
2. Review the [Issues](https://github.com/philipyong/puppy-activity-tracker/issues) page
3. Create a new issue with details about your problem

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing React framework
- [Supabase](https://supabase.com/) for backend-as-a-service
- [shadcn/ui](https://ui.shadcn.com/) for beautiful UI components
- [Tailwind CSS](https://tailwindcss.com/) for utility-first CSS

---

Made with ❤️ for puppy parents everywhere 🐾
