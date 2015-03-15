IMAGE=$1
RESOLUTIONS=( 16 32 64 )

echo "creating icons for $IMAGE"

for i in "${RESOLUTIONS[@]}"
do
	echo "creating icon of $ix$i resolution. Result in $i-$IMAGE"
	convert $IMAGE -resize $ix$i $i-$IMAGE
done
