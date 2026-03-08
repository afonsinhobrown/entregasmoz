@echo off
setlocal

echo ==========================================
echo   EntregasMoz - Gerador de APK (Debug)
echo ==========================================
echo.

cd /d "%~dp0"

set "JBR=C:\Program Files\Android\Android Studio\jbr"
if not exist "%JBR%\bin\java.exe" (
  echo [ERRO] Java do Android Studio nao encontrado em:
  echo        %JBR%
  echo Instale o Android Studio ou ajuste o caminho no script.
  exit /b 1
)

set "SDK=C:\Users\Acer\AppData\Local\Android\Sdk"
if not exist "%SDK%" (
  echo [ERRO] Android SDK nao encontrado em:
  echo        %SDK%
  echo Abra o Android Studio e instale o SDK.
  exit /b 1
)

set "JAVA_HOME=%JBR%"
set "PATH=%JAVA_HOME%\bin;%PATH%"

echo [INFO] Java em uso:
java -version
echo.

echo [INFO] Escrevendo android\local.properties...
> android\local.properties echo sdk.dir=C:\\Users\\Acer\\AppData\\Local\\Android\\Sdk

echo [INFO] Sincronizando Capacitor...
call npm run apk:sync
if errorlevel 1 (
  echo [ERRO] Falha no apk:sync.
  exit /b 1
)

echo [INFO] Compilando APK debug...
cd android
call gradlew.bat assembleDebug
if errorlevel 1 (
  echo [ERRO] Falha ao compilar APK.
  exit /b 1
)

echo.
echo [SUCESSO] APK gerado em:
echo %~dp0android\app\build\outputs\apk\debug\app-debug.apk
echo.
pause
