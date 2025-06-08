# Quiz Review - Batch Mode

A React + TypeScript application for bulk quiz review from Quizizz. Upload CSV files with quiz IDs and review multiple quizzes in an organized, streamlined interface.

## Features

- **CSV Upload**: Drag-and-drop CSV upload with smart parsing to extract quiz IDs from any column format
- **Batch Processing**: Real-time loading of multiple quizzes with status tracking
- **Standards Grouping**: Automatically groups quizzes by educational standards with collapsible sections
- **Rich Quiz Display**: Side-by-side interface with expandable questions and highlighted correct answers
- **Math Support**: KaTeX rendering for mathematical equations
- **Image Support**: Thumbnail previews with modal viewing
- **Content Sanitization**: HTML sanitization via DOMPurify for safe content display

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Math Rendering**: KaTeX
- **Content Security**: DOMPurify
- **API Integration**: Quizizz public API

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/prrranavv/quiz-review.git
cd quiz-review
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
npm run build
```

## Usage

1. **Upload CSV**: Click "Upload a file" and select a CSV containing quiz IDs
2. **Browse Quizzes**: Quizzes are automatically grouped by educational standards
3. **Review Content**: Click on any quiz to view questions, options, and correct answers
4. **Navigate**: Use the collapsible standards sections to organize your review workflow

## CSV Format

The application supports various CSV formats. Quiz IDs can be:
- Raw IDs: `63d4110ef133aa001d0ffdac`
- Full URLs: `https://quizizz.com/admin/quiz/63d4110ef133aa001d0ffdac`
- Mixed formats in any column

## Deployment

### Vercel (Recommended)

This application is optimized for Vercel deployment:

1. Push your code to GitHub
2. Connect your GitHub repository to Vercel
3. Vercel will automatically detect the Vite configuration and deploy

### Manual Deployment

```bash
npm run build
# Deploy the `dist` folder to your hosting provider
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License. 