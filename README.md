# CISSP Study Group Platform

A comprehensive study platform for CISSP certification candidates, designed for study group leaders to manage sessions, create questions, and facilitate collaborative learning.

## Features

### Leader Mode
- **Session Calendar**: Schedule and manage study sessions for screen sharing with participants
- **Community Message Board**: Share insights, announcements, and collaborate with other study leaders
- **Question Bank Management**: Create, organize, and manage CISSP practice questions with AI assistance

### Presentation Mode
- **Practice Questions**: Display CISSP exam-style questions during screen sharing sessions
- **AI Assistant**: Get instant explanations and clarifications on CISSP concepts
- **Interactive Quizzes**: Run timed practice quizzes during study sessions

### Key Capabilities
- **AI-Powered Question Generation**: Create CISSP questions using OpenAI integration
- **Comprehensive Question Bank**: Organize questions by domain, difficulty, and tags
- **Real-time Collaboration**: Message board with replies, likes, and pinned messages
- **Progress Tracking**: Achievement system and user statistics
- **Responsive Design**: Works on desktop and mobile devices

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **AI Integration**: OpenAI API (GPT-3.5 Turbo)
- **Data Storage**: Local Storage (browser-based)
- **Build Tool**: Vite
- **Deployment**: Netlify

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- OpenAI API key (optional, for AI features)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd cissp-study-group
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory:
```env
VITE_OPENAI_API_KEY=your_openai_api_key_here
```

4. Start the development server:
```bash
npm run dev
```

5. Open your browser and navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Usage

### Getting Started
1. Create an account by clicking "Sign up" on the login page
2. Fill in your name, email, and password (minimum 6 characters)
3. Once logged in, you'll be in Leader Mode by default

### Leader Mode
- **Calendar Tab**: Schedule study sessions by clicking on available time slots
- **Community Board Tab**: Post messages, reply to others, and pin important announcements
- **Question Bank Tab**: Add questions manually or use the AI generator to create CISSP questions

### Presentation Mode
- Switch to Presentation Mode using the toggle in the header
- **Practice Questions**: Navigate through questions, reveal answers, and get AI explanations
- **AI Assistant**: Ask questions about CISSP concepts and get detailed explanations
- **Interactive Quiz**: Run timed quizzes with questions from your question bank

### AI Features
To use AI features, you need an OpenAI API key:
1. Get an API key from [OpenAI](https://platform.openai.com/api-keys)
2. Add it to your `.env` file as `VITE_OPENAI_API_KEY`
3. AI features include:
   - Question generation from topics
   - Enhanced explanations for practice questions
   - CISSP concept explanations in the AI Assistant

## Data Storage

This application uses browser Local Storage for data persistence. This means:
- Data is stored locally in your browser
- Data persists between sessions
- Data is not shared between different browsers or devices
- Clearing browser data will remove all stored information

For production use with multiple users, consider implementing:
- Backend API with database storage
- User authentication system
- Real-time synchronization
- Data backup and recovery

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and commit: `git commit -m 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For questions or support, please open an issue in the repository or contact the development team.

## Roadmap

Future enhancements may include:
- Backend integration with database storage
- Real-time collaboration features
- Advanced analytics and progress tracking
- Mobile app development
- Integration with CISSP study materials
- Video conferencing integration
- Advanced AI features and personalization