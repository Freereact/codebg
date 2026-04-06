#!/usr/bin/env bash
# Bootstrap a fresh Ubuntu 24.04 droplet for CodeBG deployment.
# Run as root: bash bootstrap-vm.sh
#
# Installs: Node.js 22, Docker + Compose, nginx, Certbot, git
# Hardens: firewall, SSH, fail2ban, unattended upgrades
set -euo pipefail

echo "=== CodeBG VM Bootstrap ==="

# ─── System updates ───────────────────────────────────────────────────────────
apt-get update -qq
DEBIAN_FRONTEND=noninteractive apt-get upgrade -y -qq

# ─── Essential packages ───────────────────────────────────────────────────────
DEBIAN_FRONTEND=noninteractive apt-get install -y -qq \
  curl wget git rsync ufw fail2ban unattended-upgrades \
  apt-transport-https ca-certificates gnupg lsb-release

# ─── Firewall (UFW) ──────────────────────────────────────────────────────────
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw --force enable
echo "[firewall] UFW enabled: 22, 80, 443 open"

# ─── SSH hardening ────────────────────────────────────────────────────────────
sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin prohibit-password/' /etc/ssh/sshd_config
sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/^#\?MaxAuthTries.*/MaxAuthTries 3/' /etc/ssh/sshd_config
sed -i 's/^#\?X11Forwarding.*/X11Forwarding no/' /etc/ssh/sshd_config
systemctl restart sshd
echo "[ssh] Hardened: key-only, max 3 tries, no X11"

# ─── Fail2ban ─────────────────────────────────────────────────────────────────
cat > /etc/fail2ban/jail.local << 'F2B'
[sshd]
enabled = true
port = ssh
maxretry = 5
bantime = 3600
findtime = 600
F2B
systemctl enable fail2ban
systemctl restart fail2ban
echo "[fail2ban] Enabled: 5 retries, 1h ban"

# ─── Unattended security upgrades ────────────────────────────────────────────
cat > /etc/apt/apt.conf.d/20auto-upgrades << 'UPG'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
APT::Periodic::AutocleanInterval "7";
UPG
echo "[upgrades] Automatic security updates enabled"

# ─── Node.js 22 (via NodeSource) ─────────────────────────────────────────────
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y -qq nodejs
echo "[node] $(node --version) installed"

# ─── Docker + Compose ─────────────────────────────────────────────────────────
curl -fsSL https://get.docker.com | bash
systemctl enable docker
systemctl start docker
echo "[docker] $(docker --version) installed"

# ─── nginx ────────────────────────────────────────────────────────────────────
apt-get install -y -qq nginx
systemctl enable nginx
systemctl start nginx
echo "[nginx] installed and running"

# ─── Certbot (Let's Encrypt) ─────────────────────────────────────────────────
apt-get install -y -qq certbot python3-certbot-nginx
echo "[certbot] installed"

# ─── Clone repo ──────────────────────────────────────────────────────────────
mkdir -p ~/projects
if [ ! -d ~/projects/codebg ]; then
  git clone https://github.com/codebg-team/codebg.git ~/projects/codebg
  echo "[git] Repo cloned to ~/projects/codebg"
else
  echo "[git] Repo already exists at ~/projects/codebg"
fi

# ─── Create web directories ──────────────────────────────────────────────────
mkdir -p /var/www/codebg /var/www/sample-apps /var/www/projects /var/www/sites /var/www/certbot
chown -R 1000:1000 /var/www/projects /var/www/sites
echo "[dirs] Web directories created"

# ─── Kernel hardening ────────────────────────────────────────────────────────
cat > /etc/sysctl.d/99-codebg-hardening.conf << 'SYSCTL'
# Ignore ICMP redirects
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.default.accept_redirects = 0
net.ipv6.conf.all.accept_redirects = 0

# Don't send ICMP redirects
net.ipv4.conf.all.send_redirects = 0
net.ipv4.conf.default.send_redirects = 0

# Reverse path filtering (anti-spoofing)
net.ipv4.conf.all.rp_filter = 1
net.ipv4.conf.default.rp_filter = 1

# Ignore broadcast pings
net.ipv4.icmp_echo_ignore_broadcasts = 1

# SYN flood protection
net.ipv4.tcp_syncookies = 1
net.ipv4.tcp_max_syn_backlog = 2048
net.ipv4.tcp_synack_retries = 2

# Disable IP source routing
net.ipv4.conf.all.accept_source_route = 0
net.ipv4.conf.default.accept_source_route = 0
SYSCTL
sysctl -p /etc/sysctl.d/99-codebg-hardening.conf > /dev/null
echo "[kernel] Network hardening applied"

# ─── Done ─────────────────────────────────────────────────────────────────────
echo ""
echo "=== Bootstrap complete ==="
echo "Node:   $(node --version)"
echo "npm:    $(npm --version)"
echo "Docker: $(docker --version)"
echo "nginx:  $(nginx -v 2>&1)"
echo ""
echo "Next steps:"
echo "  1. Update GitHub test-ci environment: VM_HOST=<this-ip>"
echo "  2. Push to test-ci branch to trigger deployment"
echo "  3. Certbot will auto-provision SSL on first deploy"
