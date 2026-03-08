FROM nginx:1.29.5-alpine

ARG DOMAIN
ARG PORT
ARG API_URL
ARG WEB_URL

# Social URLs
ARG DISCORD_URL
ARG X_URL
ARG YT_URL
ARG TW_URL

# Install dependencies
RUN apk update && apk add --no-cache logrotate busybox-suid


# Copy configuration files
COPY nginx.conf     /etc/nginx/nginx.conf.template
COPY logrotate.conf /etc/logrotate.d/nginx
COPY html           /usr/share/nginx/html


# Replace variables in the html files
RUN discord_url=${DISCORD_URL} \
    x_url=${X_URL}             \
    yt_url=${YT_URL}           \
    tw_url=${TW_URL}           \
    envsubst '$discord_url $x_url $yt_url $tw_url'  \
      < /usr/share/nginx/html/default.template.html \
      > /usr/share/nginx/html/default.html.tmp      \
    && mv /usr/share/nginx/html/default.html.tmp /usr/share/nginx/html/default.template.html

COPY html/default.template.html /usr/share/nginx/html/404.html
COPY html/default.template.html /usr/share/nginx/html/403.html
COPY html/default.template.html /usr/share/nginx/html/500.html
COPY html/default.template.html /usr/share/nginx/html/502.html
COPY html/default.template.html /usr/share/nginx/html/503.html
COPY html/default.template.html /usr/share/nginx/html/504.html

RUN sed 's/{{http_code}}/404/g; s/{{message}}/Page Not Found/g'                     \
    /usr/share/nginx/html/default.template.html > /usr/share/nginx/html/404.html && \
    sed 's/{{http_code}}/403/g; s/{{message}}/Forbidden/g'                          \
    /usr/share/nginx/html/default.template.html > /usr/share/nginx/html/403.html && \
    sed 's/{{http_code}}/500/g; s/{{message}}/Internal Server Error/g'              \
    /usr/share/nginx/html/default.template.html > /usr/share/nginx/html/500.html && \
    sed 's/{{http_code}}/502/g; s/{{message}}/Bad Gateway/g'                        \
    /usr/share/nginx/html/default.template.html > /usr/share/nginx/html/502.html && \
    sed 's/{{http_code}}/503/g; s/{{message}}/Service Unavailable/g'                \
    /usr/share/nginx/html/default.template.html > /usr/share/nginx/html/503.html && \
    sed 's/{{http_code}}/504/g; s/{{message}}/Gateway Timeout/g'                    \
    /usr/share/nginx/html/default.template.html > /usr/share/nginx/html/504.html

# Delete default.template.html file
RUN rm -f /usr/share/nginx/html/default.template.html


# Set permissions for logrotate configuration
RUN chmod 644 /etc/logrotate.d/nginx

# Add logrotate cron job
RUN echo "0 0 * * * /usr/sbin/logrotate /etc/logrotate.d/nginx" > /etc/crontabs/root

# Replace environment variables in configuration files
RUN DOMAIN=${DOMAIN}   \
    PORT=${PORT}       \
    API_URL=${API_URL} \
    WEB_URL=${WEB_URL} \
    envsubst '$DOMAIN $PORT $API_URL $WEB_URL' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf


EXPOSE ${PORT}

# Start crond and nginx
CMD crond && nginx -g "daemon off;"
