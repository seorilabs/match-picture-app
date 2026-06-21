package com.github.magicsih.MatchSymbol;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;
import com.github.magicsih.MatchSymbol.gameservices.GameServicesPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(GameServicesPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
