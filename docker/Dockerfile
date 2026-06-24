# Python 3.12 基础镜像
FROM python:3.12-slim AS backend-base

ARG HTTP_PROXY
ARG HTTPS_PROXY
ARG NO_PROXY

# 安装系统依赖
RUN set -eux; \
    if [ -n "${HTTP_PROXY:-}" ]; then \
        printf 'Acquire::http::Proxy "%s";\n' "$HTTP_PROXY" > /etc/apt/apt.conf.d/99proxy; \
        printf 'Acquire::https::Proxy "%s";\n' "${HTTPS_PROXY:-$HTTP_PROXY}" >> /etc/apt/apt.conf.d/99proxy; \
    fi; \
    printf 'Acquire::Retries "5";\nAcquire::http::Pipeline-Depth "0";\n' > /etc/apt/apt.conf.d/80-build-retries; \
    sed -i 's|http://deb.debian.org/debian-security|https://mirrors.aliyun.com/debian-security|g; s|http://deb.debian.org/debian|https://mirrors.aliyun.com/debian|g' /etc/apt/sources.list.d/debian.sources 2>/dev/null || \
    sed -i 's|http://deb.debian.org/debian-security|https://mirrors.aliyun.com/debian-security|g; s|http://deb.debian.org/debian|https://mirrors.aliyun.com/debian|g' /etc/apt/sources.list; \
    apt-get update && apt-get install -y \
    gcc \
    g++ \
    curl \
    git \
    wget \
    unzip \
    pandoc \
    texlive-xetex \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libnss3 \
    libxss1 \
    libgbm1 \
    libgtk-3-0 \
    libx11-xcb1 \
    libxcb-dri3-0 \
    libdrm2 \
    libxdamage1 \
    libxrandr2 \
    libxcomposite1 \
    libxcursor1 \
    libxi6 \
    libxtst6 \
    libglib2.0-0 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/* /etc/apt/apt.conf.d/99proxy /etc/apt/apt.conf.d/80-build-retries

# 安装 Chrome (使用国内镜像)
RUN wget https://registry.npmmirror.com/-/binary/chrome-for-testing/138.0.7204.183/linux64/chrome-linux64.zip \
    && unzip chrome-linux64.zip \
    && mv chrome-linux64 /opt/chrome \
    && ln -s /opt/chrome/chrome /usr/bin/google-chrome \
    && rm chrome-linux64.zip

# 安装 ChromeDriver (使用国内镜像)
RUN wget https://registry.npmmirror.com/-/binary/chrome-for-testing/138.0.7204.183/linux64/chromedriver-linux64.zip \
    && unzip chromedriver-linux64.zip \
    && mv chromedriver-linux64/chromedriver /usr/bin/chromedriver \
    && chmod +x /usr/bin/chromedriver \
    && rm -rf chromedriver-linux64*

# 设置工作目录
WORKDIR /app

# 安装 uv
RUN pip install uv -i https://pypi.tuna.tsinghua.edu.cn/simple/

# 使用国内源（可选）
ENV UV_INDEX_URL=https://pypi.tuna.tsinghua.edu.cn/simple/

# 先复制依赖文件（利用缓存）
COPY src/backend/pyproject.toml ./pyproject.toml
COPY src/backend/uv.lock ./uv.lock

# 安装依赖（基于 lock，保证稳定）
RUN uv sync --frozen

# 再复制代码（避免频繁失效缓存）
COPY src/backend/ ./

# 覆盖配置文件
COPY docker/docker_config.yaml /app/agentchat/config.yaml

# 环境变量
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1
ENV PATH="/app/.venv/bin:${PATH}"

# 暴露端口
EXPOSE 7860

# 启动服务
CMD ["uvicorn", "agentchat.main:app", "--host", "0.0.0.0", "--port", "7860"]
