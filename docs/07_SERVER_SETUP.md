# 07. Ubuntu 서버 환경 설정

Ubuntu 서버에 PostgreSQL 16, Redis 7을 apt로 설치하고 프로젝트 배포를 위한 환경을 구성하는 가이드.

> **참고**: 로컬 개발 환경(Docker postgres:18-alpine, redis:8.0-alpine)과 버전 차이가 있으나, 이 프로젝트에서 사용하는 기능 범위에서는 호환됩니다.

---

## PostgreSQL 16 설치

### 공식 저장소 추가 및 설치

```bash
# 필수 패키지 설치
sudo apt update
sudo apt install -y wget gnupg2

# PostgreSQL 공식 저장소 추가
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -

# 설치
sudo apt update
sudo apt install -y postgresql-16

# 서비스 시작 및 자동 시작 설정
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### DB 및 사용자 생성

```bash
sudo -u postgres psql <<EOF
CREATE USER pilates WITH PASSWORD 'abcde12#';
CREATE DATABASE pilates_db OWNER pilates;
GRANT ALL PRIVILEGES ON DATABASE pilates_db TO pilates;
EOF
```

### 동작 확인

```bash
psql -U pilates -d pilates_db -h 127.0.0.1 -c "SELECT version();"
```

### 외부 접근 설정 (필요 시)

로컬에서만 접속한다면 기본 설정으로 충분합니다. 외부 접근이 필요한 경우:

```bash
# pg_hba.conf 편집
sudo nano /etc/postgresql/16/main/pg_hba.conf
# 맨 아래에 추가:
# host  all  all  0.0.0.0/0  md5

# postgresql.conf 편집
sudo nano /etc/postgresql/16/main/postgresql.conf
# listen_addresses = '*'

# 재시작
sudo systemctl restart postgresql
```

### 관리 명령어

```bash
# 상태 확인
sudo systemctl status postgresql

# 중지 / 시작 / 재시작
sudo systemctl stop postgresql
sudo systemctl start postgresql
sudo systemctl restart postgresql

# 완전 삭제
sudo apt purge -y postgresql-16 postgresql-client-16
sudo apt autoremove -y
sudo rm -rf /var/lib/postgresql/16/
sudo rm -rf /etc/postgresql/16/
```

---

## Redis 7 설치

### 공식 저장소 추가 및 설치

```bash
# Redis 공식 저장소 추가
curl -fsSL https://packages.redis.io/gpg | sudo gpg --dearmor -o /usr/share/keyrings/redis-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/redis-archive-keyring.gpg] https://packages.redis.io/deb $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/redis.list

# 설치
sudo apt update
sudo apt install -y redis-server

# 서비스 시작 및 자동 시작 설정
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

### 보안 설정 (권장)

```bash
sudo nano /etc/redis/redis.conf
```

변경할 항목:

```conf
# 외부 접근 차단 (로컬만 허용)
bind 127.0.0.1 ::1

# 비밀번호 설정
requirepass 원하는비밀번호
```

변경 후 재시작:

```bash
sudo systemctl restart redis-server
```

### 동작 확인

```bash
redis-cli -a 원하는비밀번호 ping
# → PONG 출력되면 정상
```

### 관리 명령어

```bash
# 상태 확인
sudo systemctl status redis-server

# 중지 / 시작 / 재시작
sudo systemctl stop redis-server
sudo systemctl start redis-server
sudo systemctl restart redis-server

# 완전 삭제
sudo apt purge -y redis-server
sudo apt autoremove -y
sudo rm -rf /var/lib/redis/
sudo rm -rf /etc/redis/
```

---

## 설치 확인

```bash
# PostgreSQL 확인
psql -U pilates -d pilates_db -h 127.0.0.1 -c "SELECT version();"

# Redis 확인
redis-cli -a 원하는비밀번호 ping
```

---

## 프로젝트 배포

### 사전 요구사항

- Ubuntu 22.04+ 서버
- PostgreSQL 16 설치 완료 (위 섹션 참고)
- Node.js 20 LTS 이상

### 1단계: Node.js 20 LTS 설치

```bash
# NodeSource 저장소 추가
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Node.js 설치
sudo apt install -y nodejs

# 버전 확인
node -v   # v20.x.x
npm -v    # 10.x.x
```

### 2단계: 프로젝트 클론 및 의존성 설치

```bash
# 배포 디렉토리 생성
sudo mkdir -p /opt/pilates
sudo chown $USER:$USER /opt/pilates

# 프로젝트 클론
cd /opt/pilates
git clone https://github.com/chihwany/pilates.git .

# 백엔드 의존성 설치
cd /opt/pilates/server
npm install
```

### 3단계: 환경변수 설정

```bash
cp /opt/pilates/server/.env.example /opt/pilates/server/.env
nano /opt/pilates/server/.env
```

프로덕션 `.env` 설정:

```env
# Database (필수)
DATABASE_URL=postgresql://pilates:프로덕션비밀번호@127.0.0.1:5432/pilates_db

# JWT (필수 - 반드시 변경)
JWT_SECRET=프로덕션-jwt-시크릿-무작위-문자열
JWT_EXPIRES_IN=7d

# Anthropic API (필수 - 컨디션 분석 기능)
ANTHROPIC_API_KEY=sk-ant-실제-api-키

# Server
PORT=3000
NODE_ENV=production
```

> **보안**: `JWT_SECRET`은 반드시 긴 무작위 문자열로 변경하세요.
> ```bash
> # 무작위 시크릿 생성
> openssl rand -hex 32
> ```

### 4단계: 데이터베이스 마이그레이션 및 시드

```bash
cd /opt/pilates/server

# 스키마를 DB에 적용
npm run db:push

# 운동 카탈로그 시드 (354개 운동, 22개 카테고리)
npx tsx src/db/seed.ts
```

시드 확인:

```bash
psql -U pilates -d pilates_db -h 127.0.0.1 -c "SELECT COUNT(*) FROM exercise_catalog;"
# → 354
```

### 5단계: 백엔드 빌드 및 실행 테스트

```bash
cd /opt/pilates/server

# TypeScript → JavaScript 빌드
npm run build

# 실행 테스트 (Ctrl+C로 종료)
npm start
```

헬스체크 확인:

```bash
curl http://localhost:3000/api/health
# → {"status":"ok","timestamp":"...","db":"connected"}
```

### 6단계: systemd 서비스 등록

```bash
sudo nano /etc/systemd/system/pilates-api.service
```

서비스 파일 내용:

```ini
[Unit]
Description=Pilates AI API Server
After=network.target postgresql.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/opt/pilates/server
ExecStart=/usr/bin/node dist/index.js
Restart=on-failure
RestartSec=5
Environment=NODE_ENV=production

# 환경변수 파일 로드
EnvironmentFile=/opt/pilates/server/.env

# 로그
StandardOutput=journal
StandardError=journal
SyslogIdentifier=pilates-api

[Install]
WantedBy=multi-user.target
```

> **참고**: `User=ubuntu`를 실제 서버 사용자에 맞게 변경하세요.

서비스 활성화 및 시작:

```bash
sudo systemctl daemon-reload
sudo systemctl enable pilates-api
sudo systemctl start pilates-api

# 상태 확인
sudo systemctl status pilates-api

# 로그 확인
sudo journalctl -u pilates-api -f
```

### 7단계: Nginx 리버스 프록시 설정

```bash
sudo apt install -y nginx
sudo nano /etc/nginx/sites-available/pilates
```

Nginx 설정:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # API 요청을 백엔드로 프록시
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # 타임아웃 (시퀀스 생성에 시간이 걸릴 수 있음)
        proxy_read_timeout 60s;
        proxy_send_timeout 60s;
    }
}
```

활성화:

```bash
sudo ln -s /etc/nginx/sites-available/pilates /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### 8단계: SSL 인증서 (Let's Encrypt)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

자동 갱신 확인:

```bash
sudo certbot renew --dry-run
```

### 9단계: 방화벽 설정

```bash
sudo ufw allow 22/tcp     # SSH
sudo ufw allow 80/tcp     # HTTP
sudo ufw allow 443/tcp    # HTTPS
sudo ufw enable
sudo ufw status
```

> **주의**: PostgreSQL 포트(5432)는 외부에 열지 않습니다. 로컬 접속만 허용.

---

## 프론트엔드 배포

### Expo 웹 빌드 (Nginx로 서빙)

```bash
cd /opt/pilates/front

# 의존성 설치
npm install

# API URL을 프로덕션 서버로 설정
echo "EXPO_PUBLIC_API_URL=https://your-domain.com/api" > .env

# 웹 빌드
npx expo export --platform web

# 빌드 결과물을 Nginx로 서빙
sudo mkdir -p /var/www/pilates
sudo cp -r dist/* /var/www/pilates/
```

Nginx에 프론트엔드 서빙 추가 (별도 도메인 또는 서브도메인 사용 시):

```nginx
server {
    listen 80;
    server_name app.your-domain.com;

    root /var/www/pilates;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### 모바일 앱 빌드 (EAS Build)

```bash
cd /opt/pilates/front

# EAS CLI 설치
npm install -g eas-cli

# Expo 로그인
eas login

# 빌드 (Android APK)
eas build --platform android --profile preview

# 빌드 (iOS - Apple Developer 계정 필요)
eas build --platform ios --profile preview
```

> 모바일 앱의 API URL은 `front/.env`의 `EXPO_PUBLIC_API_URL`을 프로덕션 도메인으로 설정해야 합니다.

---

## 배포 후 확인

```bash
# 1. 서비스 상태
sudo systemctl status pilates-api
sudo systemctl status nginx
sudo systemctl status postgresql

# 2. API 헬스체크
curl https://your-domain.com/api/health

# 3. 운동 카탈로그 확인 (인증 필요)
curl https://your-domain.com/api/exercises?search=plank \
  -H "Authorization: Bearer <JWT_TOKEN>"

# 4. 로그 확인
sudo journalctl -u pilates-api --since "1 hour ago"
```

---

## 업데이트 배포

```bash
cd /opt/pilates

# 최신 코드 가져오기
git pull origin main

# 백엔드 재빌드
cd server
npm install
npm run build

# DB 마이그레이션 (스키마 변경 시)
npm run db:push

# 서비스 재시작
sudo systemctl restart pilates-api

# 프론트엔드 재빌드 (변경 시)
cd /opt/pilates/front
npm install
npx expo export --platform web
sudo cp -r dist/* /var/www/pilates/
```

---

## 문제 해결

### 서버가 시작되지 않을 때

```bash
# 로그 확인
sudo journalctl -u pilates-api -n 50 --no-pager

# 환경변수 확인
cat /opt/pilates/server/.env

# 수동 실행으로 에러 확인
cd /opt/pilates/server
node dist/index.js
```

### DB 연결 실패

```bash
# PostgreSQL 상태 확인
sudo systemctl status postgresql

# 수동 접속 테스트
psql -U pilates -d pilates_db -h 127.0.0.1

# pg_hba.conf에서 로컬 접속 허용 확인
sudo cat /etc/postgresql/16/main/pg_hba.conf | grep pilates
```

### Nginx 502 Bad Gateway

```bash
# 백엔드가 실행 중인지 확인
curl http://127.0.0.1:3000/api/health

# Nginx 설정 문법 검사
sudo nginx -t

# Nginx 로그 확인
sudo tail -f /var/log/nginx/error.log
```

### 포트 충돌

```bash
# 3000 포트를 사용 중인 프로세스 확인
sudo lsof -i :3000
# 또는
sudo ss -tlnp | grep 3000
```
