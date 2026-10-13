#include "core/config/engine.h"
#include "core/object/class_db.h"
#import <AppTrackingTransparency/AppTrackingTransparency.h>
#import <UIKit/UIKit.h>
#import <UserMessagingPlatform/UserMessagingPlatform.h>

// 엔진 singleton은 앱 수명 동안 유지한다. 콜백은 main queue에서 ObjectID로 재조회한다.
class MatchAdPrivacy : public Object {
	GDCLASS(MatchAdPrivacy, Object);
	bool pending = false;
	id active_observer = nil;

protected:
	static void _bind_methods() {
		ClassDB::bind_method(D_METHOD("tracking_status"), &MatchAdPrivacy::tracking_status);
		ClassDB::bind_method(D_METHOD("can_request_ads"), &MatchAdPrivacy::can_request_ads);
		ClassDB::bind_method(D_METHOD("request_tracking_authorization"), &MatchAdPrivacy::request_tracking_authorization);
		ADD_SIGNAL(MethodInfo("authorization_finished", PropertyInfo(Variant::INT, "status")));
	}

public:
	int tracking_status() const {
		return (int)ATTrackingManager.trackingAuthorizationStatus;
	}
	bool can_request_ads() const {
		return UMPConsentInformation.sharedInstance.canRequestAds;
	}
	bool request_tracking_authorization() {
		if (pending || tracking_status() != ATTrackingManagerAuthorizationStatusNotDetermined) {
			return false;
		}
		// 누락된 용도 설명은 OS 호출 전에 차단한다. 릴리스 검사에서도 누락을 실패시킨다.
		NSString *purpose = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"NSUserTrackingUsageDescription"];
		if (![purpose isKindOfClass:NSString.class] || purpose.length == 0) {
			return false;
		}
		pending = true;
		const ObjectID instance_id = get_instance_id();
		dispatch_async(dispatch_get_main_queue(), ^{
			auto *instance = Object::cast_to<MatchAdPrivacy>(ObjectDB::get_instance(instance_id));
			if (instance) {
				instance->request_when_active();
			}
		});
		return true;
	}
	void request_when_active() {
		if (UIApplication.sharedApplication.applicationState != UIApplicationStateActive) {
			if (active_observer == nil) {
				const ObjectID instance_id = get_instance_id();
				active_observer = [NSNotificationCenter.defaultCenter
					addObserverForName:UIApplicationDidBecomeActiveNotification object:nil
					queue:NSOperationQueue.mainQueue usingBlock:^(NSNotification *) {
						auto *instance = Object::cast_to<MatchAdPrivacy>(ObjectDB::get_instance(instance_id));
						if (instance) {
							// 활성화 알림 처리 뒤 다음 main queue에서 권한창을 요청한다.
							dispatch_async(dispatch_get_main_queue(), ^{
								auto *current = Object::cast_to<MatchAdPrivacy>(ObjectDB::get_instance(instance_id));
								if (current) current->request_when_active();
							});
						}
					}];
			}
			return;
		}
		if (active_observer != nil) {
			[NSNotificationCenter.defaultCenter removeObserver:active_observer];
			active_observer = nil;
		}
		const ObjectID instance_id = get_instance_id();
		[ATTrackingManager requestTrackingAuthorizationWithCompletionHandler:^(ATTrackingManagerAuthorizationStatus status) {
			dispatch_async(dispatch_get_main_queue(), ^{
				auto *instance = Object::cast_to<MatchAdPrivacy>(ObjectDB::get_instance(instance_id));
				if (instance) {
					instance->pending = false;
					instance->emit_signal("authorization_finished", (int)status);
				}
			});
		}];
	}
	~MatchAdPrivacy() {
		if (active_observer != nil) [NSNotificationCenter.defaultCenter removeObserver:active_observer];
	}
};

static MatchAdPrivacy *privacy = nullptr;
void initialize_match_ad_privacy() {
	ClassDB::register_class<MatchAdPrivacy>();
	privacy = memnew(MatchAdPrivacy);
	Engine::get_singleton()->add_singleton(Engine::Singleton("MatchAdPrivacy", privacy));
}
void deinitialize_match_ad_privacy() {
	Engine::get_singleton()->remove_singleton("MatchAdPrivacy");
	memdelete(privacy);
	privacy = nullptr;
}
