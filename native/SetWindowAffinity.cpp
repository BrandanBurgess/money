#include <iostream>
#include <windows.h>

int main(int argc, char* argv[]) {
    if (argc < 3) {
        std::cerr << "Usage: SetWindowAffinity <hwnd> <affinity>" << std::endl;
        return 1;
    }

    // Parse the HWND (window handle) and affinity value from arguments
    HWND hwnd = (HWND)std::stoull(argv[1]);
    DWORD affinity = std::stoul(argv[2]);

    // Call the Windows API function
    BOOL result = SetWindowDisplayAffinity(hwnd, affinity);

    if (result) {
        std::cout << "Success" << std::endl;
        return 0;
    } else {
        std::cerr << "Failed to set window display affinity. Error: " << GetLastError() << std::endl;
        return 1;
    }
}
