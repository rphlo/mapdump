FROM node:10-alpine AS alpine

WORKDIR /app

RUN npm add yarn
# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY ./frontend/package.json ./frontend/yarn.lock ./
## install only the packages defined in the package-lock.json (faster than the normal npm install)
RUN yarn install
# Copy the contents of the project to the image

# Run 'npm start' when the container starts.
ENV REACT_APP_API_URL='http://localhost'
CMD ["yarn", "run", "start"]