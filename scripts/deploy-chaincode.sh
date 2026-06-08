#!/bin/bash
# =============================================================================
# Skrip deploy chaincode plasma-nutfah ke Hyperledger Fabric test-network.
#
# PRASYARAT:
#   1. Sudah meng-clone fabric-samples & mengunduh binary Fabric:
#        curl -sSL https://raw.githubusercontent.com/hyperledger/fabric/main/scripts/install-fabric.sh | bash -s -- docker samples binary
#   2. Docker & Docker Compose berjalan.
#   3. Struktur folder:
#        fabric-samples/
#        plasma-nutfah-blockchain/   <-- proyek ini, sejajar dengan fabric-samples
#
# CARA PAKAI (dari dalam folder plasma-nutfah-blockchain):
#   bash scripts/deploy-chaincode.sh
# =============================================================================
set -e

FABRIC_SAMPLES="../fabric-samples"
CC_NAME="plasma-nutfah"
CC_PATH="$(pwd)/chaincode/plasma-nutfah"
CHANNEL="mychannel"

if [ ! -d "$FABRIC_SAMPLES/test-network" ]; then
  echo "ERROR: folder $FABRIC_SAMPLES/test-network tidak ditemukan."
  echo "Pastikan fabric-samples berada sejajar dengan folder proyek ini."
  exit 1
fi

cd "$FABRIC_SAMPLES/test-network"

echo ">> Menghentikan jaringan lama (jika ada)…"
./network.sh down

echo ">> Menyalakan jaringan + membuat channel '$CHANNEL'…"
./network.sh up createChannel -c "$CHANNEL" -ca

echo ">> Men-deploy chaincode '$CC_NAME'…"
./network.sh deployCC \
  -ccn "$CC_NAME" \
  -ccp "$CC_PATH" \
  -ccl javascript \
  -c "$CHANNEL"

echo ""
echo "=============================================================="
echo " Chaincode '$CC_NAME' berhasil di-deploy ke channel '$CHANNEL'."
echo " Selanjutnya: daftarkan identitas aplikasi (lihat README) lalu"
echo " set FABRIC_MOCK=false pada backend/.env."
echo "=============================================================="
