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

## 환경변수 설정

`server/.env`에 연결 정보를 추가:

```env
DATABASE_URL=postgresql://pilates:원하는비밀번호@127.0.0.1:5432/pilates_db
REDIS_URL=redis://:원하는비밀번호@127.0.0.1:6379
```
