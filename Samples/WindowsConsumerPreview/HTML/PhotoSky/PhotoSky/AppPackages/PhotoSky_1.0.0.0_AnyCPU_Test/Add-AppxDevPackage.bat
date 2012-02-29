@ECHO OFF
pushd %~dp0

REM #######################################################################
REM # Add-AppxDevPackage.bat
REM #
REM # <summary>
REM #    Add-AppxDevPackage.bat is a PowerShell script designed to install
REM #    Appx developer packages created by Visual Studio.  The Visual
REM #    Studio "Prepare Package" creates a signed Appx to a local target
REM #    folder.  The target folder will contain the .appx application file,
REM #    the signing certificate .cer file, the Add-AppxDevPackage.bat
REM #    script, plus a .\Dependencies\ folder containing all the 
REM #    framework packages used by the application.
REM #
REM #    When executed from a local directory, the Add-AppxDevPackage script
REM #    simplifies installing a VS developer package on a new computer by
REM #    automating the following functions.
REM #
REM #      1. Installs all the framework packages contained in
REM #         .\Dependencies
REM #
REM #      2. Installs the signing certificate .cer file into the
REM #         local machine Trusted Root Certification Authorities store.
REM #
REM #      3. Installs the application package .appx file.
REM #
REM #######################################################################


REM # The following line checks whether the script is being run in an elevated command window
whoami.exe /GROUPS | find.exe "S-1-16-12288" >nul
set RETURN=%ERRORLEVEL%
IF "%RETURN%"=="1" (
    ECHO *****************************************************
    ECHO *                                                   *
    ECHO *       Must be run from an elevated prompt.        *
    ECHO *                                                   *
    ECHO *****************************************************
    goto CLEANUP
)

ECHO Using Powershell Cmdlets to Install Appx Files

ECHO  ^- Installing Developer Signing Cert...
powershell -command $CertFile = get-childItem .\ ^| where{$_.extension -eq '.cer'}; if(!$CertFile) {exit 2}; if($Certfile.Count -gt 1) {exit 3}; $Args='^-addstore root ' + "$CertFile.name"; Write-Host "$Args";$Return=(Start-Process "certutil.exe" $Args -NoNewWindow -Wait -Passthru).ExitCode; if($Return -ne 0) {exit 4}
set RETURN=%ERRORLEVEL%
IF "%RETURN%"=="2" ( powershell -command Write-Host "ERROR: NO DEVELOPER CERTIFICATE FOUND!" -foregroundcolor "red"
    goto CLEANUP)
IF "%RETURN%"=="3" ( powershell -command Write-Host "ERROR: MORE THAN ONE DEVELOPER CERTIFICATE FOUND!" -foregroundcolor "red"
    goto CLEANUP)
IF "%RETURN%"=="4" powershell -command Write-Host "WARNING: FAILED TO INSTALL DEVELOPER CERTIFICATE!  ATTEMPING TO CONTINUE DEPLOYMENT..." -foregroundcolor "yellow"


ECHO  ^- Installing Dependency Packages...
powershell -command Import-Module appx; if(Test-Path -Path .\Dependencies) { $DependencyFiles = get-childItem .\Dependencies ^| where{$_.extension -eq '.appx'} ^| foreach-object -process{$_.FullName}; if(!$DependencyFiles) {exit 1}; foreach($Dependency in $DependencyFiles){ Write-Output "    Installing:  $Dependency"; Add-AppxPackage $Dependency; if(!$?){ Write-Host "WARNING: FAILED TO INSTALL DEPENDENCY PACKAGE!  THIS FAILURE IS EXPECTED IF YOU ARE RUNNING ON AN X86 OPERATING SYSTEM.  ATTEMPING TO CONTINUE DEPLOYMENT..." -foregroundcolor "yellow";} }} else {exit 1}
set RETURN=%ERRORLEVEL%
IF "%RETURN%"=="1" ECHO      No Dependencies Found.
        

ECHO  ^- Installing Developer Package...        
powershell -command Import-Module appx; $PackageFile = get-childItem .\ ^| where{$_.extension -eq '.appx'} ^| foreach-object -process{$_.FullName}; if(!$PackageFile){exit 6}; if($PackageFile.Count -gt 1){exit 7}; Write-Output "    Installing:  $PackageFile"; Add-AppxPackage $PackageFile; if(!$?) {exit 8}
set RETURN=%ERRORLEVEL%
IF "%RETURN%"=="0" powershell -command Write-Host "DEVELOPER PACKAGE SUCCESSFULLY INSTALLED!" -foregroundcolor "green"
IF "%RETURN%"=="6" powershell -command Write-Host "ERROR: NO DEVELOPER PACKAGE FOUND TO INSTALL!" -foregroundcolor "red"
IF "%RETURN%"=="7" powershell -command Write-Host "ERROR: MORE THAN ONE DEVELOPER PACKAGE FOUND!" -foregroundcolor "red"
IF "%RETURN%"=="8" powershell -command Write-Host "ERROR: FAILED TO INSTALL DEVELOPER PACKAGE!" -foregroundcolor "red"
   
:CLEANUP
IF "%RETURN%" GTR "4" powershell -command $CertFile = get-childItem .\ ^| where{$_.extension -eq '.cer'}; certutil.exe -delstore root $CertFile.name
popd
pause
exit /b %RETURN%