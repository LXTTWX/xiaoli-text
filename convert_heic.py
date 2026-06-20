import imageio.v3 as iio
import os

dir_path = r'D:\Backup\Desktop\新建文件夹'
for f in os.listdir(dir_path):
    if f.lower().endswith('.heic'):
        src = os.path.join(dir_path, f)
        dst = os.path.join(dir_path, f[:-5] + '.jpg')
        if not os.path.exists(dst):
            try:
                img = iio.imread(src)
                iio.imwrite(dst, img, extension='.jpg', quality=85)
                print(f'OK: {f}')
            except Exception as e:
                print(f'FAIL: {f} - {e}')
        else:
            print(f'EXISTS: {f[:-5]}.jpg')
