FROM python:3.11

WORKDIR /app

# Install uv and add to PATH
RUN curl -LsSf https://astral.sh/uv/install.sh | sh

ENV PATH="/root/.cargo/bin:/root/.local/bin:${PATH}"

COPY . /app/