# NotesNinja

NotesNinja is a comprehensive study aid application that helps students organize, review, and test their knowledge through various interactive features. The application combines note-taking, flashcard creation, and quiz generation to provide a complete study experience.

## Features

- **Note Management**
  - Create and organize notes with rich text formatting
  - Upload and extract text from documents (PDF, images)
  - Automatic summarization and key term extraction
  - Favorite important notes for quick access

- **Flashcards**
  - Create flashcard decks from notes
  - Interactive flashcard review system
  - Track progress and mastery
  - Spaced repetition for effective learning

- **Quizzes**
  - Generate quizzes from notes
  - Multiple choice questions
  - Track quiz results and progress
  - Difficulty levels (easy, medium, hard)

- **User Management**
  - Secure authentication
  - Role-based access (student, admin)
  - Progress tracking
  - Data synchronization

## Technologies Used

### Frontend
- **Next.js 15** - React framework for server-side rendering and static site generation
- **React 19** - UI library for building user interfaces
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **Radix UI** - Unstyled, accessible components
- **TanStack Query** - Data fetching and state management
- **React Hook Form** - Form handling
- **Zod** - Schema validation

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **Prisma** - Type-safe database ORM
- **PostgreSQL** - Relational database
- **NextAuth.js** - Authentication
- **Supabase** - Real-time database features

### AI & Processing
- **Google Generative AI** - Content generation and analysis
- **Tesseract.js** - OCR for text extraction from images
- **PDF.js** - PDF processing

## Local Setup

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database
- Google Cloud account (for AI features)
- Supabase account (for real-time features)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/notesninja.git
   cd notesninja
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory with the following variables:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/notesninja"
   NEXTAUTH_SECRET="your-secret-key"
   NEXTAUTH_URL="http://localhost:3000"
   GOOGLE_API_KEY="your-google-api-key"
   SUPABASE_URL="your-supabase-url"
   SUPABASE_KEY="your-supabase-key"
   ```

4. **Set up the database**
   ```bash
   npx prisma migrate dev
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:3000`

## Project Structure

```
notesninja/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── student/           # Student dashboard and features
│   └── admin/             # Admin dashboard
├── components/            # Reusable UI components
├── lib/                   # Utility functions and services
├── hooks/                 # Custom React hooks
├── prisma/               # Database schema and migrations
├── public/               # Static assets
└── types/                # TypeScript type definitions
```

## Database Schema

The application uses the following main models:

- **User**: Stores user information and authentication details
- **Note**: Manages user notes with content and metadata
- **Attachment**: Handles file uploads and storage
- **FlashcardDeck**: Organizes flashcards into decks
- **Flashcard**: Stores individual flashcard content
- **QuizResult**: Tracks quiz performance and progress

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please open an issue in the GitHub repository or contact the development team.
