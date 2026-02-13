# Stage 1: Minimal test
FROM node:20-alpine

WORKDIR /app

# Create a simple hello world server
RUN echo "const http = require('http');" > server.js && \
    echo "const server = http.createServer((req, res) => {" >> server.js && \
    echo "  res.statusCode = 200;" >> server.js && \
    echo "  res.setHeader('Content-Type', 'text/plain');" >> server.js && \
    echo "  res.end('Hello from Cloud Run! Infrastructure is working.');" >> server.js && \
    echo "});" >> server.js && \
    echo "server.listen(3000, '0.0.0.0', () => {" >> server.js && \
    echo "  console.log('Server running on port 3000');" >> server.js && \
    echo "});" >> server.js

EXPOSE 3000
CMD ["node", "server.js"]
