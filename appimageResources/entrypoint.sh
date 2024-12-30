SCRIPT_DIR="$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")"

# Normal appimages seem to use rpath to modify the library search path but that doesn't
# work for dynamic loading where js calls dlopen. So we need to set LD_LIBRARY_PATH.
export LD_LIBRARY_PATH=$SCRIPT_DIR/usr/lib:$LD_LIBRARY_PATH
export PATH=$SCRIPT_DIR/usr/bin:$PATH

# Add ImageMagick paths https://imagemagick.org/script/resources.php
imagemagic_etc_path=$(ls -d $SCRIPT_DIR/usr/etc/ImageMagick-* | head -n 1)
imagemagic_usr_module_path=$(ls -d $SCRIPT_DIR/usr/lib/ImageMagick-* | head -n 1)

export MAGICK_HOME=$SCRIPT_DIR/usr
export MAGICK_CONFIGURE_PATH=$imagemagic_etc_path:$imagemagic_usr_module_path/config-Q16:$MAGICK_CONFIGURE_PATH
export MAGICK_CODER_MODULE_PATH=$imagemagic_usr_module_path/modules-Q16/coders:$MAGICK_CODER_MODULE_PATH
export MAGICK_FILTER_MODULE_PATH=$imagemagic_usr_module_path/modules-Q16/filters:$MAGICK_FILTER_MODULE_PATH
export LD_LIBRARY_PATH=$imagemagic_usr_module_path:$imagemagic_usr_module_path/modules-Q16/coders:$imagemmagic_usr_module_path/modules-Q16/filters:$LD_LIBRARY_PATH

# Run the app
exec -a "$0" "$SCRIPT_DIR/usr/bin/node" --enable-source-maps "$SCRIPT_DIR/nodeapp/dist/index.js" "$@"
