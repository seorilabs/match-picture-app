#import <Foundation/Foundation.h>
#import <Capacitor/Capacitor.h>

// Capacitor가 ObjC 런타임에서 GameServices 플러그인을 발견하도록 등록한다.
CAP_PLUGIN(GameServicesPlugin, "GameServices",
    CAP_PLUGIN_METHOD(isAvailable, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(signIn, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(submitScore, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(showLeaderboard, CAPPluginReturnPromise);
)
