FROM node:12.18.1-buster

WORKDIR /app

# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY ./frontend/package.json ./frontend/yarn.lock ./
## install only the packages defined in the package-lock.json (faster than the normal npm install)
RUN yarn install --force --production --frozen-lockfile
# Copy the contents of the project to the image

# Run 'npm start' when the container starts.
ENV REACT_APP_API_URL='http://localhost'
CMD ["yarn", "start"]