@echo off
set SRC=C:\Users\DELL\Desktop\gesture_output\models
set DST=%~dp0..\models
if not exist "%DST%" mkdir "%DST%"
copy /Y "%SRC%\gesture_only_model.joblib" "%DST%\"
copy /Y "%SRC%\gesture_label_encoder.joblib" "%DST%\"
echo Models copied to %DST%
dir "%DST%"
