#!/usr/bin/env python3
"""Script para renomear diretório de migration com nome inválido"""

import os
import sys
from pathlib import Path

def main():
    migrations_dir = Path("prisma/migrations")
    
    if not migrations_dir.exists():
        print(f"❌ Diretório não encontrado: {migrations_dir}")
        sys.exit(1)
    
    # Procurar diretório com nome problemático
    old_dir = None
    for item in migrations_dir.iterdir():
        if item.is_dir() and ('$' in item.name or 'date' in item.name.lower()):
            old_dir = item
            break
    
    if not old_dir:
        print("✅ Nenhum diretório com nome problemático encontrado")
        return
    
    new_name = "20250124020000_add_produtos_intencoes_loja"
    new_dir = migrations_dir / new_name
    
    if new_dir.exists():
        print(f"⚠️  Diretório destino já existe: {new_dir}")
        print(f"   Removendo diretório antigo: {old_dir}")
        import shutil
        shutil.rmtree(old_dir)
        return
    
    print(f"Renomeando: {old_dir.name} -> {new_name}")
    old_dir.rename(new_dir)
    print(f"✅ Diretório renomeado com sucesso")

if __name__ == "__main__":
    main()

