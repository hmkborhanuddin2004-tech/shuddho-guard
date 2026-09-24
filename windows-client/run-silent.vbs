Set WshShell = CreateObject("WScript.Shell")
' উইন্ডো না দেখিয়ে সম্পূর্ণ ব্যাকগ্রাউন্ডে Node.js স্ক্রিপ্ট চালানো
strCurDir = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)
WshShell.Run "node """ & strCurDir & "\shuddho-pc-guard.js""", 0, False
Set WshShell = Nothing
