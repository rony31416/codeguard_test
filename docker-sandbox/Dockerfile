FROM docker:24-dind

# Install Python for running user code
RUN apk add --no-cache python3 py3-pip

# Expose Docker daemon
EXPOSE 2375

# Start Docker daemon
CMD ["dockerd", "--host=tcp://0.0.0.0:2375", "--host=unix:///var/run/docker.sock"]