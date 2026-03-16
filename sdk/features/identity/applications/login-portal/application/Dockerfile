FROM nginx:alpine AS production

# Build context should be:
# dist/sdk/features/identity/applications/login-portal/application/browser
COPY . /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
RUN rm -f /usr/share/nginx/html/nginx.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
