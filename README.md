# Weather MCP Client

A Proof of Concept web client application built with Remix that demonstrates how to interact with MCP (Model Context Protocol) servers. This client serves as a companion to the [Weather MCP Server](https://github.com/Krytons/Weather-MCP-Server) and provides a user-friendly interface for consuming weather data through the MCP protocol.

## 🌟 Features

- **Modern Web Interface**: Built with Remix for server-side rendering and optimal performance
- **MCP Integration**: Demonstrates best practices for MCP client implementation
- **Real-time Weather Data**: Interactive interface for querying weather information
- **Responsive Design**: Works seamlessly across desktop and mobile devices
- **Type Safety**: Full TypeScript implementation for robust development

## 🏗️ Architecture

This client application showcases:

- **MCP Client Implementation**: How to properly connect to and communicate with MCP servers
- **Remix Framework**: Leveraging Remix for full-stack web application development
- **Modern React Patterns**: Using the latest React features and best practices
- **API Integration**: Clean separation between MCP communication and UI components

## 📋 Prerequisites

- Node.js v18.0.0 or higher
- npm (Node Package Manager)
- A running instance of the [Weather MCP Server](https://github.com/Krytons/Weather-MCP-Server)

## 🚀 Quick Start

### 1. Installation

```bash
# Clone the repository
git clone https://github.com/Krytons/Weather-MCP-Client.git
cd Weather-MCP-Client

# Install dependencies
npm install
```

### 2. Configuration

Create a `.env` file in the root directory with the required environment variables:

```env
# MCP Server Configuration (Required)
MCP_SERVER_URL=http://localhost:3000/mcp

# Anthropic Claude Configuration (Required)
ANTHROPIC_SECRET=your_anthropic_api_key_here

# Optional: Claude Model Configuration
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
```

**Important**: Make sure to:
- Replace `your_anthropic_api_key_here` with your actual Anthropic API key
- Ensure your Weather MCP Server is running on the configured URL
- Keep your `.env` file secure and add it to `.gitignore`

### 3. Development

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:3000` (or the port specified in your configuration).

### 4. Production Build

Build the application for production:

```bash
npm run build
```

Run the production server:

```bash
npm start
```

## 📁 Project Structure

```
├── app/                    # Remix app directory
│   ├── components/         # Reusable React components
│   ├── routes/            # Remix route components
│   ├── styles/            # CSS and styling files
│   └── utils/             # Utility functions and helpers
├── build/                 # Production build output
│   ├── client/            # Client-side assets
│   └── server/            # Server-side code
├── public/                # Static assets
├── package.json           # Project dependencies and scripts
└── tailwind.config.js     # Tailwind CSS configuration
```

## 🔧 Development Features

### Hot Module Replacement
The development server includes hot module replacement for instant feedback during development.

### TypeScript Support
Full TypeScript support with type checking and IntelliSense.

### Tailwind CSS
Pre-configured Tailwind CSS for rapid UI development with utility-first styling.

## 🌐 MCP Integration

This client demonstrates how to:

- **Connect to MCP Servers**: Establish connections using the MCP protocol
- **Handle MCP Tools**: Invoke tools like `getCurrentWeather` from the Weather MCP Server
- **Process Responses**: Parse and display MCP server responses in a user-friendly format
- **Error Handling**: Gracefully handle connection issues and API errors

### Example Usage

The client provides an intuitive interface for:
- Entering city names to get weather information
- Displaying weather data in a clean, readable format
- Handling loading states and error conditions
- Showcasing real-time MCP communication

## 🎨 Styling and UI

- **Tailwind CSS**: Utility-first CSS framework for rapid development
- **Responsive Design**: Mobile-first approach with responsive breakpoints
- **Modern UI Components**: Clean, accessible interface components

## 🚀 Deployment

### Build Process

The application uses Remix's optimized build process:

```bash
npm run build
```

This creates:
- `build/client/` - Client-side assets (CSS, JS, images)
- `build/server/` - Server-side code for SSR

### Deployment Options

**Remix App Server (Recommended)**
The built-in Remix app server is production-ready:

```bash
npm start
```

**Other Hosting Providers**
The application can be deployed to various platforms:
- Vercel
- Netlify
- Railway
- Fly.io
- Traditional Node.js hosting

Ensure you deploy both the `build/client` and `build/server` directories.

## 🧪 Testing

### Manual Testing
1. Start the Weather MCP Server
2. Launch the client application
3. Test weather queries through the UI
4. Verify MCP communication and data display

### Integration Testing
Test the complete flow from UI interaction to MCP server communication and response rendering.

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `MCP_SERVER_URL` | URL of the Weather MCP Server | `http://localhost:3000/mcp` | ✅ |
| `ANTHROPIC_MODEL` | Anthropic Claude model to use | `claude-3-5-sonnet-20241022` | ❌ |
| `ANTHROPIC_SECRET` | Anthropic API secret key | - | ✅ |

### MCP Configuration

Configure the MCP client connection settings based on your server setup:
- Server endpoint configuration
- Authentication (if required)
- Timeout settings
- Retry logic

## 🔨 Development

### Available Scripts

- `npm run dev` - Start development server with HMR
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run typecheck` - Run TypeScript type checking
- `npm run lint` - Run linting (if configured)

### Adding New Features

1. **New Routes**: Add route components in `app/routes/`
2. **Components**: Create reusable components in `app/components/`
3. **MCP Integration**: Extend MCP client functionality in utility modules
4. **Styling**: Use Tailwind classes or add custom CSS

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🔗 Related Projects

- [Weather MCP Server](https://github.com/Krytons/Weather-MCP-Server) - The companion MCP server providing weather data

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **[Bartolomeo Caruso](https://github.com/Krytons)** - Tech Leader, Architecture and Implementation
- **[Arturo Marzo](https://github.com/IlLicenziato)** - Software Engineer and Revisor

## 🙏 Acknowledgments

- Remix team for the excellent full-stack framework
- MCP (Model Context Protocol) community for protocol specifications
- Tailwind CSS for the utility-first styling approach

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/Krytons/Weather-MCP-Client/issues) page
2. Create a new issue with detailed information
3. Provide relevant logs and configuration details

## 🔧 Troubleshooting

### Common Issues

**Connection to MCP Server Fails**
- Ensure the Weather MCP Server is running
- Check the server URL configuration
- Verify network connectivity

**Build Errors**
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version compatibility
- Verify all dependencies are properly installed

**Styling Issues**
- Ensure Tailwind CSS is properly configured
- Check for conflicting CSS rules
- Verify PostCSS configuration

---

**Happy Weather Tracking! 🌤️**