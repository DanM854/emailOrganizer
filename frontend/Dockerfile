FROM node:18

WORKDIR /app

# Comprobar si existe package.json, si no, crear un nuevo proyecto
COPY . .
RUN if [ ! -f package.json ]; then \
      npm install -g @angular/cli && \
      ng new temp-project --skip-git --style=scss --routing=true && \
      cp -r temp-project/* . && \
      find temp-project -maxdepth 1 -name ".*" -type f -exec cp {} . \; && \
      rm -rf temp-project && \
      npm install; \
    else \
      npm install; \
    fi

<<<<<<< HEAD
CMD ["npm", "start", "--", "--host", "0.0.0.0"]
=======
CMD ["npm", "start", "--", "--host", "0.0.0.0"]

#prueba
>>>>>>> 8d69724f3c02767047dbf0481459aea4a899185c
