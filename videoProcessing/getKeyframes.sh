wget -O original.webm $1 
ffmpeg -i original.webm -c:v libvpx-vp9 -b:v 0 -crf 45 -pass 1 -an -f null /dev/null && \
ffmpeg -i original.webm -c:v libvpx-vp9 -b:v 0 -crf 45 -pass 2 -c:a libopus processed.webm
ffprobe -v quiet -i original.webm -show_entries packet=pos,pts_time,flags -select_streams v -of compact=p=0:nk=1 > dump_original.txt
ffprobe -v quiet -i processed.webm -show_entries packet=pos,pts_time,flags -select_streams v -of compact=p=0:nk=1 > dump_processed.txt