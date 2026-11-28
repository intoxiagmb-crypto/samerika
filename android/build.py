#!/usr/bin/env python3
"""Build and sign the standalone Android shell using Android SDK tools, offline."""
import hashlib
import json
import os
from pathlib import Path
import secrets
import shutil
import subprocess
import xml.etree.ElementTree as ET
import zipfile

ROOT = Path(__file__).resolve().parent
SDK = Path(os.environ.get("ANDROID_HOME", "/opt/homebrew/share/android-commandlinetools"))
JAVA = Path(os.environ.get("JAVA_HOME", "/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home"))
TOOLS = SDK / "build-tools" / "36.0.0"
ANDROID = SDK / "platforms/android-36/android.jar"
SRC = ROOT / "app/src/main"
BUILD = ROOT / "build"
SIGNING = ROOT / ".signing"
OUTPUT = ROOT.parent / "outputs/android"
env = dict(os.environ, JAVA_HOME=str(JAVA))
env["PATH"] = str(JAVA / "bin") + os.pathsep + env.get("PATH", "")

def run(*args):
    subprocess.run([str(arg) for arg in args], check=True, env=env, cwd=ROOT)

for required in [ANDROID, TOOLS / "aapt2", JAVA / "bin/javac"]:
    if not required.exists():
        raise SystemExit(f"Missing {required}. Set ANDROID_HOME and JAVA_HOME; install SDK platform/build-tools 36.")
if BUILD.exists():
    shutil.rmtree(BUILD)
for folder in [BUILD / "classes", BUILD / "generated", BUILD / "dex", OUTPUT, SIGNING]:
    folder.mkdir(parents=True, exist_ok=True)
SIGNING.chmod(0o700)

# Convert the project's existing vector emblem into a launcher vector, preserving paths.
svg = ET.parse(ROOT.parent / "public/brand/samerika-emblem.svg").getroot()
colors = {"url(#orange)": "#FF7A00", "url(#blue)": "#0756A4", "url(#green)": "#23852C"}
paths = "\n".join(f'<path android:fillColor="{colors[p.attrib["fill"]]}" android:fillType="evenOdd" android:pathData="{p.attrib["d"]}" />'
    for p in svg.findall("{http://www.w3.org/2000/svg}path"))
(SRC / "res/drawable/brand.xml").write_text(
    '<vector xmlns:android="http://schemas.android.com/apk/res/android" android:width="108dp" android:height="108dp" android:viewportWidth="108" android:viewportHeight="108">'
    '<group android:translateX="25.8" android:translateY="26.8" android:scaleX="0.08" android:scaleY="0.08">'
    '<group android:translateX="-260" android:translateY="-112">' + paths + '</group></group></vector>\n')

run(TOOLS / "aapt2", "compile", "--dir", SRC / "res", "-o", BUILD / "resources.zip")
run(TOOLS / "aapt2", "link", "-o", BUILD / "unsigned.apk", "-I", ANDROID,
    "--manifest", SRC / "AndroidManifest.xml", "--java", BUILD / "generated",
    BUILD / "resources.zip")
# Embed this small, trusted bridge at build time: no asset disk read on cold start.
bridge = (SRC / "assets/integration.js").read_text(encoding="utf-8")
if len(bridge.encode("utf-8")) > 60000:
    raise SystemExit("Integration bridge is too large for a Java string constant.")
(BUILD / "generated/IntegrationSource.java").write_text(
    "package com.samerikapower.app;\nfinal class IntegrationSource {\n"
    "static final String SCRIPT = " + json.dumps(bridge, ensure_ascii=True) + ";\n}\n")
sources = sorted((SRC / "java").rglob("*.java")) + sorted((BUILD / "generated").rglob("*.java"))
run(JAVA / "bin/javac", "--release", "8", "-classpath", ANDROID, "-d", BUILD / "classes", *sources)
run(JAVA / "bin/jar", "cf", BUILD / "classes.jar", "-C", BUILD / "classes", ".")
run(TOOLS / "d8", "--release", "--min-api", "29", "--lib", ANDROID,
    "--output", BUILD / "dex", BUILD / "classes.jar")
with zipfile.ZipFile(BUILD / "unsigned.apk", "a", compression=zipfile.ZIP_DEFLATED) as archive:
    for dex in sorted((BUILD / "dex").glob("*.dex")):
        archive.write(dex, dex.name)
run(TOOLS / "zipalign", "-f", "-p", "4", BUILD / "unsigned.apk", BUILD / "aligned.apk")

key = SIGNING / "samerika-release.p12"
password = SIGNING / "password.txt"
if not key.exists():
    if not password.exists():
        fd = os.open(password, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        with os.fdopen(fd, "w") as stream:
            stream.write(secrets.token_urlsafe(36) + "\n")
    run(JAVA / "bin/keytool", "-genkeypair", "-keystore", key, "-storetype", "PKCS12",
        "-storepass:file", password, "-alias", "samerika", "-keyalg", "RSA", "-keysize", "3072",
        "-validity", "10000", "-dname", "CN=Samerika Power, O=Samerika Power Private Limited, C=IN")
    key.chmod(0o600)
if not password.exists():
    raise SystemExit("Signing password missing. Restore android/.signing/password.txt from your backup.")
apk = OUTPUT / "Samerika-Power.apk"
run(TOOLS / "apksigner", "sign", "--ks", key, "--ks-pass", f"file:{password}",
    "--ks-key-alias", "samerika", "--out", apk, BUILD / "aligned.apk")
run(TOOLS / "apksigner", "verify", "--verbose", "--print-certs", apk)
run(TOOLS / "zipalign", "-c", "4", apk)
(OUTPUT / "Samerika-Power.apk.sha256").write_text(hashlib.sha256(apk.read_bytes()).hexdigest() + "  " + apk.name + "\n")
print(f"\nCreated {apk} ({apk.stat().st_size:,} bytes)")
