import time

print("开始长时间运行的脚本...")

for i in range(10):
    print(f"计数器: {i}")

    time.sleep(2)  # 每次暂停2秒

print("脚本完成!")
