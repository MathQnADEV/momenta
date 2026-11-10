$word = New-Object -ComObject Word.Application
$word.Visible = $false
$doc = $word.Documents.Open('C:\xampp\htdocs\photobooth\PRD_Teknis_PhotoBooth_PSD.docx')
$text = $doc.Content.Text
$text | Out-File -FilePath 'C:\xampp\htdocs\photobooth\PRD_content.txt' -Encoding UTF8
$doc.Close()
$word.Quit()
