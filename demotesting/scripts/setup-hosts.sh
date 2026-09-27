#!/usr/bin/env bash
# ==============================================================================
# OneMoon Local Security Testing - Hosts Configuration Script
# ==============================================================================
# Configures local-only test hostnames resolving to 127.0.0.1 for phishing detection testing.
# Never modifies /etc/hosts without explicit user confirmation.
# ==============================================================================

set -euo pipefail

HOSTS_FILE="/etc/hosts"
START_MARKER="# --- BEGIN ONEMOON TEST HOSTS ---"
END_MARKER="# --- END ONEMOON TEST HOSTS ---"

REQUIRED_HOSTS=(
  "login.test"
  "file-upload.test"
  "payment.test"
  "collector.test"
)

REQUIRED_ENTRIES=(
  "127.0.0.1 login.test"
  "127.0.0.1 file-upload.test"
  "127.0.0.1 payment.test"
  "127.0.0.1 collector.test"
)

print_header() {
  echo "=========================================================="
  echo "  OneMoon Phishing Simulation Local Hosts Configuration   "
  echo "=========================================================="
  echo "Local test domains for realistic domain and URL analysis:"
  for host in "${REQUIRED_HOSTS[@]}"; do
    echo "  - $host -> 127.0.0.1"
  done
  echo "=========================================================="
}

check_hosts() {
  echo ""
  echo "Checking resolution of test hostnames..."
  local all_resolved=true

  for host in "${REQUIRED_HOSTS[@]}"; do
    if grep -qE "127\.0\.0\.1[[:space:]]+.*\\b${host}\\b" "$HOSTS_FILE" 2>/dev/null; then
      echo "  [OK] $host is mapped to 127.0.0.1 in $HOSTS_FILE"
    else
      echo "  [MISSING] $host is NOT configured in $HOSTS_FILE"
      all_resolved=false
    fi
  done

  echo ""
  if [ "$all_resolved" = true ]; then
    echo "Status: All test hostnames are properly configured in $HOSTS_FILE."
    return 0
  else
    echo "Status: One or more test hostnames are missing from $HOSTS_FILE."
    echo ""
    echo "Required entries:"
    echo "----------------------------------------------------------"
    echo "$START_MARKER"
    for entry in "${REQUIRED_ENTRIES[@]}"; do
      echo "$entry"
    done
    echo "$END_MARKER"
    echo "----------------------------------------------------------"
    echo ""
    echo "You can manually copy the entries above into $HOSTS_FILE, or"
    echo "run this script with '--install' to append them with sudo confirmation:"
    echo "  bash scripts/setup-hosts.sh --install"
    return 1
  fi
}

install_hosts() {
  print_header
  echo ""
  echo "Required block to add to $HOSTS_FILE:"
  echo "----------------------------------------------------------"
  echo "$START_MARKER"
  for entry in "${REQUIRED_ENTRIES[@]}"; do
    echo "$entry"
  done
  echo "$END_MARKER"
  echo "----------------------------------------------------------"
  echo ""

  if grep -qF "$START_MARKER" "$HOSTS_FILE" 2>/dev/null; then
    echo "The OneMoon test hosts block already exists in $HOSTS_FILE."
    echo "If you need to refresh it, run with '--remove' first, then '--install'."
    return 0
  fi

  read -r -p "Do you want to add these local host entries to $HOSTS_FILE using sudo? [y/N]: " confirm
  case "$confirm" in
    [yY][eE][sS]|[yY])
      echo "Requesting sudo privileges to update $HOSTS_FILE..."
      {
        echo ""
        echo "$START_MARKER"
        for entry in "${REQUIRED_ENTRIES[@]}"; do
          echo "$entry"
        done
        echo "$END_MARKER"
      } | sudo tee -a "$HOSTS_FILE" > /dev/null
      echo "[SUCCESS] Successfully added test hostnames to $HOSTS_FILE."
      check_hosts
      ;;
    *)
      echo "Operation cancelled. No changes were made to $HOSTS_FILE."
      echo "You may still test using path-based access on http://localhost:4173/"
      ;;
  esac
}

remove_hosts() {
  print_header
  echo ""
  if ! grep -qF "$START_MARKER" "$HOSTS_FILE" 2>/dev/null; then
    echo "No OneMoon test host block found in $HOSTS_FILE."
    return 0
  fi

  read -r -p "Do you want to remove the OneMoon test hosts block from $HOSTS_FILE using sudo? [y/N]: " confirm
  case "$confirm" in
    [yY][eE][sS]|[yY])
      echo "Requesting sudo privileges to update $HOSTS_FILE..."
      sudo sed -i.bak "/$START_MARKER/,/$END_MARKER/d" "$HOSTS_FILE"
      echo "[SUCCESS] Successfully removed OneMoon test host block from $HOSTS_FILE."
      ;;
    *)
      echo "Operation cancelled. No changes were made."
      ;;
  esac
}

# Main command line parser
case "${1:-}" in
  --install|-i)
    install_hosts
    ;;
  --remove|-r)
    remove_hosts
    ;;
  --check|-c)
    print_header
    check_hosts || exit 1
    ;;
  --help|-h)
    print_header
    echo "Usage:"
    echo "  bash scripts/setup-hosts.sh           # Display current status and required entries"
    echo "  bash scripts/setup-hosts.sh --install # Prompt and add entries to /etc/hosts with sudo"
    echo "  bash scripts/setup-hosts.sh --remove  # Prompt and remove entries from /etc/hosts with sudo"
    echo "  bash scripts/setup-hosts.sh --check   # Check if hostnames resolve (exit code 0/1)"
    ;;
  *)
    print_header
    check_hosts || true
    ;;
esac
